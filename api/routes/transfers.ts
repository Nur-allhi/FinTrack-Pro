import express from "express";
import { createTransfer } from "../db/index.js";
import { transferSchema, validate } from "../../shared/validation.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const parsed = validate(transferSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const result = await createTransfer(req.user!.id, parsed.data);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "POST /api/transfers");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

export default router;
