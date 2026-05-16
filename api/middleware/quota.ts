import { Request, Response, NextFunction } from "express";
import { supabase } from "../db.js";

const TABLES = ['members', 'accounts', 'transactions', 'investments', 'investment_returns'];

const ROW_ESTIMATES: Record<string, number> = {
  members: 128,
  accounts: 360,
  transactions: 576,
  investments: 128,
  investment_returns: 160,
};

export const requireQuota = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id || !supabase) return next();

  try {
    const { data: userData } = await supabase.auth.getUser(req.headers.authorization?.slice(7) || '');
    const limitMB = (userData?.user?.user_metadata as any)?.storage_limit_mb || 5;

    let totalBytes = 0;

    for (const table of TABLES) {
      const { count } = await supabase!
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', req.user.id);

      totalBytes += (count || 0) * (ROW_ESTIMATES[table] || 200);
    }

    const usedMB = totalBytes / 1024 / 1024;

    if (usedMB >= limitMB) {
      const usedKB = +(usedMB * 1024).toFixed(0);
      const limitKB = limitMB * 1024;
      return res.status(403).json({
        error: `Storage limit reached (${usedKB} KB / ${limitKB} KB). Free up space or upgrade.`,
        usedKB,
        limitKB,
      });
    }

    next();
  } catch {
    next();
  }
};
