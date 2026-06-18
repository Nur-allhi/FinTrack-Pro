import { Request, Response, NextFunction } from "express";
import { supabase, createClientForToken, runWithClient, withTimeout } from "../db.js";

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

function isLocalhost(req: Request): boolean {
  const host = req.headers.host || "";
  return host.startsWith("localhost:") || host === "localhost" || host.startsWith("127.0.0.1:");
}

export function setSessionCookie(req: Request, res: Response, token: string): void {
  const secure = !isLocalhost(req);
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${secure ? "; Secure" : ""}`
  );
}

export function clearSessionCookie(req: Request, res: Response): void {
  const secure = !isLocalhost(req);
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? "; Secure" : ""}`
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
    const { data, error } = await withTimeout(supabase.auth.getUser(token), 3000);
    if (error || !data.user) {
      clearSessionCookie(req, res);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = { id: data.user.id, email: data.user.email };

    // Create per-request Supabase client with user's JWT for RLS enforcement
    const userClient = createClientForToken(token);
    runWithClient(userClient, () => new Promise<void>((resolve) => {
      const originalEnd = res.end;
      res.end = function (...args: Parameters<typeof originalEnd>) {
        resolve();
        return originalEnd.apply(res, args);
      } as typeof res.end;
      next();
    }));
  } catch (err: unknown) {
    // Supabase unreachable — trust cached token, allow request through
    // This handles offline scenarios where the dev server can't reach Supabase
    // but the client has a valid cached session
    req.user = { id: 'offline', email: '' };
    const userClient = createClientForToken(token);
    runWithClient(userClient, () => new Promise<void>((resolve) => {
      const originalEnd = res.end;
      res.end = function (...args: Parameters<typeof originalEnd>) {
        resolve();
        return originalEnd.apply(res, args);
      } as typeof res.end;
      next();
    }));
  }
};
