import express from "express";
import { getGroups, createGroup, updateGroup, deleteGroup } from "../db/index.js";
import { groupSchema, groupUpdateSchema, validate } from "../../shared/validation.js";
import { sendError } from "../middleware/error.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data = await getGroups(req.user!.id);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "GET /api/groups");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = validate(groupSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    const result = await createGroup(req.user!.id, parsed.data.name, parsed.data.member_id, parsed.data.color);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "POST /api/groups");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const parsed = validate(groupUpdateSchema, req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error, "VALIDATION_ERROR");
    await updateGroup(req.user!.id, Number(req.params.id), parsed.data);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "PATCH /api/groups");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteGroup(req.user!.id, Number(req.params.id));
    res.json({ success: true, orphanedChildren: result.orphanedChildren });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ requestId: req.requestId, error: message }, "DELETE /api/groups");
    sendError(res, 500, message, "INTERNAL_ERROR");
  }
});

export default router;
