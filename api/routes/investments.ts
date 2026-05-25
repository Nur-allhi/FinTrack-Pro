import express from "express";
import { getInvestments, createInvestment, getInvestmentReturns, createInvestmentReturn } from "../db/index.js";
import { investmentSchema, investmentReturnSchema, validate } from "../../shared/validation.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data = await getInvestments(req.user!.id);
    res.json(data);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "GET /api/investments");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.get("/:id/returns", async (req, res) => {
  try {
    const data = await getInvestmentReturns(Number(req.params.id));
    res.json(data);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "GET /api/investments/:id/returns");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = validate(investmentSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const result = await createInvestment(req.user!.id, parsed.data.account_id, parsed.data.principal, parsed.data.date);
    res.json(result);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "POST /api/investments");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.post("/:id/returns", async (req, res) => {
  try {
    const parsed = validate(investmentReturnSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const result = await createInvestmentReturn(Number(req.params.id), parsed.data.date, parsed.data.amount, parsed.data.percentage);
    res.json(result);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "POST /api/investments/:id/returns");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

export default router;
