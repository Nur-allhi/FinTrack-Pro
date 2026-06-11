import express from "express";
import { getCategories, getTransactions, createTransaction, updateTransaction, deleteTransaction, renameCategory } from "../db/index.js";
import { transactionSchema, transactionUpdateSchema, categoryRenameSchema, validate } from "../../shared/validation.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await getCategories(req.user!.id);
    res.json(categories);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "GET /api/transactions/categories");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.get("/:accountId", async (req, res) => {
  try {
    const accountId = Number(req.params.accountId);
    if (isNaN(accountId) || accountId <= 0) {
      return sendError(res, 400, "Invalid account ID", "VALIDATION_ERROR");
    }
    const limit = req.query.limit ? Number(req.query.limit) : 500;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const transactions = await getTransactions(String(accountId), req.user!.id, limit, offset);
    res.json(transactions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "GET /api/transactions");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = validate(transactionSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const result = await createTransaction(req.user!.id, parsed.data);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "POST /api/transactions");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const parsed = validate(transactionUpdateSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const result = await updateTransaction(req.user!.id, Number(req.params.id), parsed.data);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "PATCH /api/transactions");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteTransaction(req.user!.id, Number(req.params.id));
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "DELETE /api/transactions");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.patch("/category/rename", async (req, res) => {
  try {
    const parsed = validate(categoryRenameSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    await renameCategory(req.user!.id, parsed.data.oldName, parsed.data.newName);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "PATCH /api/transactions/category/rename");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

export default router;
