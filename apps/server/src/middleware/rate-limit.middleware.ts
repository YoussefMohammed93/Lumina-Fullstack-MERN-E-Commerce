import type { NextFunction, Request, Response } from "express";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

/** A conservative local guard. Replace with Redis-backed limits when scaling. */
export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count += 1;

  if (entry.count > MAX_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many attempts. Please try again later.",
      },
    });
  }
  next();
}
