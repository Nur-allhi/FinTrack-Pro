import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.includes(req.method)) {
    const existing = req.headers.cookie
      ?.split(";")
      .map(c => c.trim())
      .find(c => c.startsWith(`${CSRF_COOKIE}=`));

    if (!existing) {
      const token = generateToken();
      res.setHeader("Set-Cookie", `${CSRF_COOKIE}=${token}; SameSite=Strict; Path=/; Max-Age=86400`);
    }
    return next();
  }

  const cookieToken = req.headers.cookie
    ?.split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(`${CSRF_COOKIE}=`))
    ?.split("=")[1];

  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "Invalid CSRF token", code: "CSRF_FAILED" });
  }

  next();
}
