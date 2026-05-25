import express from "express";
import { exportAllData, importAllData, clearAllData } from "../db/index.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data = await exportAllData(req.user!.id);
    res.json(data);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "GET /api/export");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.post("/", async (req, res) => {
  try {
    const { members, accounts, transactions, investments, investmentReturns } = req.body;
    const result = await importAllData(req.user!.id, { members, accounts, transactions, investments, investmentReturns });
    res.json(result);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "POST /api/import");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.delete("/clear-all", async (req, res) => {
  try {
    const result = await clearAllData(req.user!.id);
    res.json(result);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "DELETE /api/export/clear-all");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

export default router;
