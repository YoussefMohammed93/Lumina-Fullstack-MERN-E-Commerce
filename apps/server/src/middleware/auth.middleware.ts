import type { NextFunction, Request, Response } from "express";
import { Session } from "../models/session.model.js";
import { User } from "../models/user.model.js";
import { tokenHash } from "../lib/auth.js";

export const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-lumina_session"
    : "lumina_session";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1);

    if (!token)
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Sign in is required." },
      });

    const session = await Session.findOne({
      tokenHash: tokenHash(token),
      expiresAt: { $gt: new Date() },
    });

    if (!session)
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Your session has expired.",
        },
      });

    const user = await User.findById(session.userId);

    if (!user || user.status !== "active")
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Your account is unavailable.",
        },
      });

    req.user = user;
    req.sessionId = String(session._id);
    req.csrfToken = session.csrfToken;
    next();
  } catch (error) {
    next(error);
  }
}
export async function requireCsrf(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const csrfToken = req.header("x-csrf-token");

  if (!req.sessionId || !csrfToken)
    return res.status(403).json({
      success: false,
      error: { code: "CSRF_INVALID", message: "Invalid security token." },
    });

  if (csrfToken !== req.csrfToken)
    return res.status(403).json({
      success: false,
      error: { code: "CSRF_INVALID", message: "Invalid security token." },
    });

  next();
}

export function requireRole(...roles: ("user" | "admin")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have access to this resource.",
        },
      });
    }
    next();
  };
}
