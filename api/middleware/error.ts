import { Request, Response, NextFunction } from "express";

export interface ApiError {
  error: string;
  code: string;
  details?: any;
}

export function sendError(res: Response, status: number, error: string, code: string, details?: any) {
  const body: ApiError = { error, code };
  if (details !== undefined) body.details = details;
  res.status(status).json(body);
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error("Unhandled error:", err);
  sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}
