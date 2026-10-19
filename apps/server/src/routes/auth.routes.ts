import { Router } from "express";
import type { Types } from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { randomBytes } from "node:crypto";
import { Session } from "../models/session.model.js";
import { User } from "../models/user.model.js";
import {
  hashPassword,
  randomToken,
  tokenHash,
  verifyPassword,
} from "../lib/auth.js";
import { COOKIE_NAME, requireAuth } from "../middleware/auth.middleware.js";
import { authRateLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();
const SESSION_DAYS = 14;
const googleClient = new OAuth2Client();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 86_400_000,
};

const publicUser = (user: {
  _id: unknown;
  username: string;
  name?: string;
  email: string;
  role: string;
  avatarUrl?: string;
}) => ({
  id: String(user._id),
  username: user.username,
  name: user.name,
  email: user.email,
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

    if (user) {
      // Google is the source of truth for its verified profile fields.
      if (name) user.name = name;
      if (avatarUrl) user.avatarUrl = avatarUrl;
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

        if (name) user.name = name;

        if (avatarUrl) user.avatarUrl = avatarUrl;

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
      }
    }

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

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await Session.findByIdAndDelete(req.sessionId);
    res
      .clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: cookieOptions.secure,
        sameSite: "lax",
        path: "/",
      })
      .status(204)
      .end();
  } catch (error) {
    next(error);
  }
});
export default router;
