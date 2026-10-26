import { Router } from "express";
import type { Types } from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { createHash, randomBytes } from "node:crypto";
import { Session } from "../models/session.model.js";
import {
  User,
  type ISavedAddress,
  type IUserPreferences,
} from "../models/user.model.js";
import {
  hashPassword,
  randomToken,
  tokenHash,
  verifyPassword,
} from "../lib/auth.js";
import {
  COOKIE_NAME,
  requireAuth,
  requireCsrf,
} from "../middleware/auth.middleware.js";
import { authRateLimit } from "../middleware/rate-limit.middleware.js";
import { notifyNewCustomer } from "../lib/notifications.js";

const router = Router();
const SESSION_DAYS = 14;
const googleClient = new OAuth2Client();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  path: "/",
  maxAge: SESSION_DAYS * 86_400_000,
};

const publicUser = (user: {
  _id: unknown;
  username: string;
  name?: string;
  email: string;
  phone?: string;
  savedAddress?: ISavedAddress;
  preferences?: IUserPreferences;
  role: string;
  avatarUrl?: string;
}) => ({
  id: String(user._id),
  username: user.username,
  name: user.name,
  email: user.email,
  phone: user.phone,
  savedAddress: user.savedAddress
    ? {
        name: user.savedAddress.name,
        phone: user.savedAddress.phone,
        governorate: user.savedAddress.governorate,
        line1: user.savedAddress.line1,
        line2: user.savedAddress.line2,
        city: user.savedAddress.city,
        postalCode: user.savedAddress.postalCode,
        country: user.savedAddress.country,
      }
    : undefined,
  preferences: {
    orderUpdates: user.preferences?.orderUpdates ?? false,
    studioLetters: user.preferences?.studioLetters ?? false,
  },
  role: user.role,
  avatarUrl: user.avatarUrl,
});

async function createSession(userId: Types.ObjectId) {
  const token = randomToken();
  const csrfToken = randomToken();

  await Session.create({
    userId,
    tokenHash: tokenHash(token),
    csrfToken,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
  });

  return { token, csrfToken };
}

function googleUsername(email: string) {
  const base =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24) || "user";
  return `${base.slice(0, 24)}_${randomBytes(3).toString("hex")}`;
}

function googleAvatarUrl(picture?: string) {
  if (!picture) return undefined;
  try {
    const url = new URL(picture);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

router.post("/register", authRateLimit, async (req, res, next) => {
  try {
    const username = String(req.body.username ?? "")
      .trim()
      .toLowerCase();
    const email = String(req.body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? "");

    if (
      !/^[a-z0-9_]{3,30}$/.test(username) ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      password.length < 6 ||
      password.length > 128
    )
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Use a 3–30 character username, valid email, and password of at least 12 characters.",
        },
      });

    const user = await User.create({
      username,
      email,
      passwordHash: await hashPassword(password),
    });
    await notifyNewCustomer({
      userId: String(user._id),
      customer: user.name || user.username,
    });

    const session = await createSession(user._id);

    res
      .cookie(COOKIE_NAME, session.token, cookieOptions)
      .status(201)
      .json({
        success: true,
        data: { user: publicUser(user), csrfToken: session.csrfToken },
      });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === 11000
    )
      return res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: "That username or email is already in use.",
        },
      });
    next(error);
  }
});

router.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const email = String(req.body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? "");
    const user = await User.findOne({ email }).select("+passwordHash");

    if (
      !user ||
      !user.passwordHash ||
      !(await verifyPassword(password, user.passwordHash)) ||
      user.status !== "active"
    )
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Email or password is incorrect.",
        },
      });

    const session = await createSession(user._id);

    res.cookie(COOKIE_NAME, session.token, cookieOptions).json({
      success: true,
      data: { user: publicUser(user), csrfToken: session.csrfToken },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/google", authRateLimit, async (req, res, next) => {
  try {
    const credential = String(req.body.credential ?? "");
    const audience = process.env.GOOGLE_CLIENT_ID;

    if (!audience) throw new Error("GOOGLE_CLIENT_ID is not configured.");

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      return res.status(401).json({
        success: false,
        error: {
          code: "GOOGLE_TOKEN_INVALID",
          message: "Google could not verify this account.",
        },
      });
    }
    const email = payload.email.toLowerCase();
    const name = payload.name?.trim().slice(0, 80);
    const avatarUrl = googleAvatarUrl(payload.picture);

    let user = await User.findOne({ googleSubject: payload.sub });
    let createdNewCustomer = false;

    if (user) {
      if (name && !user.name) user.name = name;
      if (avatarUrl && !user.avatarUrl && !user.avatarPublicId)
        user.avatarUrl = avatarUrl;
      await user.save();
    } else {
      user = await User.findOne({ email });

      if (user && user.googleSubject && user.googleSubject !== payload.sub) {
        return res.status(409).json({
          success: false,
          error: {
            code: "GOOGLE_ACCOUNT_CONFLICT",
            message: "This email is already linked to another Google account.",
          },
        });
      }

      if (user) {
        user.googleSubject = payload.sub;

        if (name && !user.name) user.name = name;

        if (avatarUrl && !user.avatarUrl && !user.avatarPublicId)
          user.avatarUrl = avatarUrl;

        await user.save();
      } else {
        user = await User.create({
          username: googleUsername(email),
          name,
          email,
          googleSubject: payload.sub,
          avatarUrl,
          role: "user",
        });
        createdNewCustomer = true;
      }
    }

    if (createdNewCustomer)
      await notifyNewCustomer({
        userId: String(user._id),
        customer: user.name || user.username,
      });

    if (user.status !== "active")
      return res.status(401).json({
        success: false,
        error: {
          code: "ACCOUNT_DISABLED",
          message: "This account is unavailable.",
        },
      });

    const session = await createSession(user._id);

    res.cookie(COOKIE_NAME, session.token, cookieOptions).json({
      success: true,
      data: { user: publicUser(user), csrfToken: session.csrfToken },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) =>
  res.json({ success: true, data: { user: publicUser(req.user!) } }),
);

router.get("/csrf", requireAuth, (req, res) => {
  res.json({ success: true, data: { csrfToken: req.csrfToken } });
});

router.patch("/profile", requireAuth, requireCsrf, async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown> | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    if (!name || name.length > 80)
      return res.status(400).json({
        success: false,
        error: { message: "Enter a name between 1 and 80 characters." },
      });
    if (phone && !/^\+?[0-9().\s-]{7,32}$/.test(phone))
      return res.status(400).json({
        success: false,
        error: { message: "Enter a valid phone number." },
      });

    const update: {
      $set: Record<string, unknown>;
      $unset?: Record<string, "">;
    } = { $set: { name } };
    if (phone) update.$set.phone = phone;
    else update.$unset = { phone: "" };

    if (body && Object.hasOwn(body, "preferences")) {
      const value = body.preferences;
      if (!value || typeof value !== "object" || Array.isArray(value))
        return res.status(400).json({
          success: false,
          error: { message: "Enter valid account preferences." },
        });
      const preferences = value as Record<string, unknown>;
      for (const field of ["orderUpdates", "studioLetters"] as const) {
        if (
          preferences[field] !== undefined &&
          typeof preferences[field] !== "boolean"
        )
          return res.status(400).json({
            success: false,
            error: { message: "Account preferences must be enabled or disabled." },
          });
        if (typeof preferences[field] === "boolean")
          update.$set[`preferences.${field}`] = preferences[field];
      }
    }

    if (body && Object.hasOwn(body, "savedAddress")) {
      const value = body.savedAddress;
      if (!value || typeof value !== "object" || Array.isArray(value))
        return res.status(400).json({
          success: false,
          error: { message: "Enter a valid delivery address." },
        });

      const address = value as Record<string, unknown>;
      const addressFields = [
        ["name", 80],
        ["phone", 32],
        ["governorate", 80],
        ["line1", 160],
        ["line2", 160],
        ["city", 80],
        ["postalCode", 20],
      ] as const;
      const normalizedAddress: ISavedAddress = {};
      for (const [field, maxLength] of addressFields) {
        const entry = address[field];
        if (entry === undefined) continue;
        if (typeof entry !== "string" || entry.trim().length > maxLength)
          return res.status(400).json({
            success: false,
            error: { message: "Check your delivery address details." },
          });
        const normalized = entry.trim();
        if (normalized) normalizedAddress[field] = normalized;
      }

      if (
        !normalizedAddress.name ||
        !normalizedAddress.phone ||
        !/^\+?[0-9().\s-]{7,32}$/.test(normalizedAddress.phone) ||
        !normalizedAddress.governorate ||
        !normalizedAddress.line1
      )
        return res.status(400).json({
          success: false,
          error: {
            message:
              "Recipient, phone, governorate, and street address are required.",
          },
        });
      if (
        address.country !== undefined &&
        address.country !== "EG" &&
        address.country !== "Egypt"
      )
        return res.status(400).json({
          success: false,
          error: { message: "Saved delivery addresses must be in Egypt." },
        });
      normalizedAddress.country = "EG";
      update.$set.savedAddress = normalizedAddress;
    }

    if (body && Object.hasOwn(body, "avatarUrl")) {
      if (body.avatarUrl === null || body.avatarUrl === "") {
        update.$unset = {
          ...update.$unset,
          avatarUrl: "",
          avatarPublicId: "",
        };
      } else {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const avatarUrl =
          typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";
        const avatarPublicId =
          typeof body.avatarPublicId === "string"
            ? body.avatarPublicId.trim()
            : "";
        if (
          !cloudName ||
          !avatarUrl.startsWith(
            `https://res.cloudinary.com/${cloudName}/image/upload/`,
          ) ||
          !avatarPublicId.startsWith("lumina/avatars/") ||
          avatarPublicId.includes("..")
        )
          return res.status(400).json({
            success: false,
            error: { message: "Choose a valid profile image." },
          });
        update.$set.avatarUrl = avatarUrl;
        update.$set.avatarPublicId = avatarPublicId;
      }
    }

    const user = await User.findByIdAndUpdate(req.user!._id, update, {
      new: true,
      runValidators: true,
    });
    if (!user)
      return res.status(404).json({
        success: false,
        error: { message: "Your account could not be found." },
      });
    res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/avatar/signature",
  requireAuth,
  requireCsrf,
  async (req, res, next) => {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret)
        return res.status(503).json({
          success: false,
          error: { message: "Cloudinary is not configured." },
        });

      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "lumina/avatars";
      const signature = createHash("sha1")
        .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
        .digest("hex");
      res.json({
        success: true,
        data: { cloudName, apiKey, timestamp, folder, signature },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await Session.findByIdAndDelete(req.sessionId);
    res
      .clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: "/",
      })
      .status(204)
      .end();
  } catch (error) {
    next(error);
  }
});
export default router;
