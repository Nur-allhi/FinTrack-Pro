import express from "express";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "../db/index.js";
import { accountSchema, accountUpdateSchema, validate } from "../../shared/validation.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const data = await getAccounts(req.user!.id, limit, offset);
    res.json(data);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "GET /api/accounts");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = validate(accountSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const result = await createAccount(req.user!.id, parsed.data);
    res.json(result);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "POST /api/accounts");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const parsed = validate(accountUpdateSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    await updateAccount(req.user!.id, Number(req.params.id), parsed.data);
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "PATCH /api/accounts");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteAccount(req.user!.id, Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "DELETE /api/accounts");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

export default router;
