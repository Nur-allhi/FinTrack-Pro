import { Request, Response, NextFunction } from "express";

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

export function sendError(res: Response, status: number, error: string, code: string, details?: unknown) {
  const body: ApiError = { error, code };
  if (details !== undefined) body.details = details;
  res.status(status).json(body);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error("Unhandled error:", err);
  sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}
