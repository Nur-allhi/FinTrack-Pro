import { Request, Response, NextFunction } from "express";
import { supabase } from "../db.js";

const COOKIE_NAME = "sb-access-token";

export interface AuthUser {
  id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getTokenFromCookie(req: Request): string | undefined {
  const cookie = req.headers.cookie;
  if (!cookie) return undefined;
  for (const part of cookie.split(";")) {
    const trimmed = part.trim();
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    if (key === COOKIE_NAME) {
      return decodeURIComponent(trimmed.substring(idx + 1));
    }
  }
  return undefined;
}

export function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${isProd ? "; Secure" : ""}`
  );
}

export function clearSessionCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${isProd ? "; Secure" : ""}`
  );
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = getTokenFromCookie(req);

  if (!token) {
    return res.status(401).json({ error: "No session cookie found" });
  }

  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      clearSessionCookie(res);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = { id: data.user.id, email: data.user.email };
    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
};
