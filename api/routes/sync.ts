import express from "express";
import { db } from "../db.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

const SYNC_TABLES = [
  'members', 'accounts', 'transactions', 'loans',
  'loan_settlements', 'investments', 'investment_returns',
  'budgets', 'recurring_transactions',
] as const;

type SyncTable = typeof SYNC_TABLES[number];

interface SyncRecord {
  client_id: string;
  updated_at: string;
  _deleted?: boolean;
  [key: string]: unknown;
}

interface PushBody {
  records: Record<SyncTable, SyncRecord[]>;
}

// Local-only fields that clients might accidentally send
const SERVER_LOCAL_ONLY_FIELDS = ['id', 'server_id', 'sync_status', '_deleted'] as const;

function sanitizeRecord(record: SyncRecord): SyncRecord {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SERVER_LOCAL_ONLY_FIELDS.includes(key as typeof SERVER_LOCAL_ONLY_FIELDS[number])) continue;
    out[key] = value;
  }
  return out as SyncRecord;
}

// POST /api/sync/push — Bulk upsert local changes to server
router.post("/push", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { records } = req.body as PushBody;
    if (!records || typeof records !== 'object') {
      return sendError(res, 400, "records object required", "VALIDATION_ERROR");
    }

    const results: Record<string, { pushed: number; conflicts: number; ids: { client_id: string; server_id: number }[] }> = {};
    const client = db();

    for (const table of SYNC_TABLES) {
      const tableRecords = records[table];
      if (!Array.isArray(tableRecords) || tableRecords.length === 0) continue;

      let pushed = 0;
      let conflicts = 0;
      const ids: { client_id: string; server_id: number }[] = [];

      for (const record of tableRecords) {
        if (!record.client_id) continue;

        // Defense in depth: strip local-only fields
        const sanitized = sanitizeRecord(record);

        const { data: existing } = await client
          .from(table)
          .select('id, updated_at')
          .eq('client_id', sanitized.client_id)
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          if (new Date(sanitized.updated_at) < new Date(existing.updated_at)) {
            conflicts++;
            continue;
          }
          const { id, client_id: _cid, updated_at: _ua, ...fields } = sanitized;
          const { error } = await client
            .from(table)
            .update({ ...fields, client_id: sanitized.client_id, updated_at: sanitized.updated_at })
            .eq('id', existing.id)
            .eq('user_id', userId);
          if (error) {
            logger.error({ requestId: req.requestId, error: error.message, table, client_id: sanitized.client_id }, "sync push update");
            continue;
          }
          pushed++;
          ids.push({ client_id: sanitized.client_id, server_id: existing.id });
        } else {
          const { id: _localId, ...fields } = sanitized;
          const { data: inserted, error } = await client
            .from(table)
            .insert({ ...fields, user_id: userId, client_id: sanitized.client_id, updated_at: sanitized.updated_at })
            .select('id')
            .single();
          if (error || !inserted) {
            logger.error({ requestId: req.requestId, error: error?.message, table, client_id: sanitized.client_id }, "sync push insert");
            continue;
          }
          pushed++;
          ids.push({ client_id: sanitized.client_id, server_id: inserted.id });
        }
      }

      results[table] = { pushed, conflicts, ids };
    }

    const totalPushed = Object.values(results).reduce((s, r) => s + r.pushed, 0);
    if (totalPushed > 0) {
      await client.from('sync_log').insert({
        user_id: userId,
        direction: 'push',
        entity_type: 'bulk',
        record_count: totalPushed,
      });
    }

    res.json({ success: true, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "POST /api/sync/push");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

// GET /api/sync/pull?since=<timestamp> — Get server changes since timestamp
router.get("/pull", async (req, res) => {
  try {
    const userId = req.user!.id;
    const since = req.query.since as string | undefined;
    const sinceTimestamp = since || '1970-01-01T00:00:00Z';

    const client = db();
    const changes: Record<SyncTable, unknown[]> = {} as Record<SyncTable, unknown[]>;

    for (const table of SYNC_TABLES) {
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .gt('updated_at', sinceTimestamp)
        .order('updated_at', { ascending: true });

      if (error) {
        logger.error({ requestId: req.requestId, error: error.message, table }, "sync pull");
        continue;
      }
      changes[table] = data || [];
    }

    // Log sync operation
    const totalPulled = Object.values(changes).reduce((s, arr) => s + arr.length, 0);
    if (totalPulled > 0) {
      await client.from('sync_log').insert({
        user_id: userId,
        direction: 'pull',
        entity_type: 'bulk',
        record_count: totalPulled,
      });
    }

    res.json({ success: true, changes, pulledAt: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "GET /api/sync/pull");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

// POST /api/sync/initial — Full download for first sync (guest → registered)
router.post("/initial", async (req, res) => {
  try {
    const userId = req.user!.id;
    const client = db();
    const data: Record<SyncTable, unknown[]> = {} as Record<SyncTable, unknown[]>;

    for (const table of SYNC_TABLES) {
      const { data: rows, error } = await client
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true });

      if (error) {
        logger.error({ requestId: req.requestId, error: error.message, table }, "sync initial");
        continue;
      }
      data[table] = rows || [];
    }

    // Log sync operation
    const totalRecords = Object.values(data).reduce((s, arr) => s + arr.length, 0);
    await client.from('sync_log').insert({
      user_id: userId,
      direction: 'pull',
      entity_type: 'initial',
      record_count: totalRecords,
    });

    res.json({ success: true, data, syncedAt: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "POST /api/sync/initial");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

export default router;
