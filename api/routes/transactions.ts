import express from "express";
import { requireQuota } from "../middleware/quota.js";
import { getCategories, getTransactions, createTransaction, updateTransaction, deleteTransaction, renameCategory } from "../db/index.js";
import { transactionSchema, transactionUpdateSchema, categoryRenameSchema, validate } from "../../shared/validation.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await getCategories(req.user!.id);
    res.json(categories);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "GET /api/transactions/categories");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.get("/:accountId", async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const transactions = await getTransactions(req.params.accountId, req.user!.id, limit, offset);
    res.json(transactions);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "GET /api/transactions");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.post("/", requireQuota, async (req, res) => {
  try {
    const parsed = validate(transactionSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const result = await createTransaction(req.user!.id, parsed.data);
    res.json(result);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "POST /api/transactions");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const parsed = validate(transactionUpdateSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const result = await updateTransaction(req.user!.id, Number(req.params.id), parsed.data);
    if (result.notFound) return sendError(res, 404, "Transaction not found", "NOT_FOUND");
    res.json(result);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "PATCH /api/transactions");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteTransaction(req.user!.id, Number(req.params.id));
    res.json(result);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "DELETE /api/transactions");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.patch("/category/rename", async (req, res) => {
  try {
    const parsed = validate(categoryRenameSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    await renameCategory(req.user!.id, parsed.data.oldName, parsed.data.newName);
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "PATCH /api/transactions/category/rename");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

export default router;
