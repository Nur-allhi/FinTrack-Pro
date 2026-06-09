import express from "express";
import { getDeletedItems, restoreItem, permanentDeleteItem, emptyRecycleBin, type RecycleBinEntityType } from "../db/recyclebin.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

const VALID_TYPES: RecycleBinEntityType[] = ["transactions", "accounts", "loans", "members"];

function isValidType(t: string): t is RecycleBinEntityType {
  return VALID_TYPES.includes(t as RecycleBinEntityType);
}

router.get("/", async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    if (type && !isValidType(type)) {
      return sendError(res, 400, `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`, "VALIDATION_ERROR");
    }
    const items = await getDeletedItems(req.user!.id, type as RecycleBinEntityType | undefined);
    res.json(items);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "GET /api/recyclebin");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.post("/:type/:id/restore", async (req, res) => {
  try {
    const { type, id } = req.params;
    if (!isValidType(type)) {
      return sendError(res, 400, `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`, "VALIDATION_ERROR");
    }
    await restoreItem(req.user!.id, type, Number(id));
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "POST /api/recyclebin/:type/:id/restore");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.delete("/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    if (!isValidType(type)) {
      return sendError(res, 400, `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`, "VALIDATION_ERROR");
    }
    await permanentDeleteItem(req.user!.id, type, Number(id));
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "DELETE /api/recyclebin/:type/:id");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.delete("/", async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    if (type && !isValidType(type)) {
      return sendError(res, 400, `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`, "VALIDATION_ERROR");
    }
    await emptyRecycleBin(req.user!.id, type as RecycleBinEntityType | undefined);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "DELETE /api/recyclebin");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

export default router;
