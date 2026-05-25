import express from "express";
import { getMembers, createMember, deleteMember } from "../db/index.js";
import { memberSchema, validate } from "../../shared/validation.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data = await getMembers(req.user!.id);
    res.json(data);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "GET /api/members");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.post("/", async (req, res) => {
  try {
    const result = validate(memberSchema, req.body);
    if (!result.success) return sendError(res, 400, result.error, "VALIDATION_ERROR");
    const created = await createMember(req.user!.id, result.data.name, result.data.relationship || "");
    res.json(created);
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "POST /api/members");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteMember(req.user!.id, Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ requestId: req.requestId, error: err.message }, "DELETE /api/members");
    sendError(res, 500, err.message, "INTERNAL_ERROR");
  }
});

export default router;
