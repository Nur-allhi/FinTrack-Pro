import { Request, Response, NextFunction } from "express";
import { supabase, supabaseAdmin } from "../db.js";
import { config } from "../config.js";

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

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);

  if (!supabaseAdmin || !supabase) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = { id: data.user.id, email: data.user.email };
    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.email) {
    return res.status(403).json({ error: "Admin access required" });
  }
  if (!config.admin.emails.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
