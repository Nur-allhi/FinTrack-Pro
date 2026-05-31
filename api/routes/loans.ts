import express from "express";
import { getLoans, createLoan, updateLoan, settleLoan, deleteLoan } from "../db/index.js";
import { loanSchema, loanUpdateSchema, loanSettleSchema, validate } from "../../shared/validation.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const data = await getLoans(req.user!.id, limit, offset);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "GET /api/loans");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = validate(loanSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");

    const isPersonLoan = !!parsed.data.borrower_name;
    const isInterAccount = !!parsed.data.borrower_account_id;

    if (!isPersonLoan && !isInterAccount) {
      return sendError(res, 400, "Specify borrower_account_id (inter-account) or borrower_name (person loan)", "VALIDATION_ERROR");
    }
    if (isInterAccount && parsed.data.lender_account_id === parsed.data.borrower_account_id) {
      return sendError(res, 400, "Lender and borrower accounts must be different", "VALIDATION_ERROR");
    }

    const result = await createLoan(req.user!.id, parsed.data);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "POST /api/loans");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const parsed = validate(loanUpdateSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    await updateLoan(req.user!.id, Number(req.params.id), parsed.data);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "PATCH /api/loans");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.post("/:id/settle", async (req, res) => {
  try {
    const parsed = validate(loanSettleSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const result = await settleLoan(req.user!.id, Number(req.params.id), parsed.data.amount);

    if (result.notFound) return sendError(res, 404, "Loan not found", "NOT_FOUND");
    if (result.alreadySettled) return sendError(res, 400, "Loan already settled", "VALIDATION_ERROR");
    if (result.invalidAmount) return sendError(res, 400, `Invalid settlement amount. Remaining: ${result.remaining}`, "VALIDATION_ERROR");

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "POST /api/loans/:id/settle");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteLoan(req.user!.id, Number(req.params.id));
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "DELETE /api/loans");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

export default router;
