import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});

export function requestLogger(req: any, _res: any, next: any) {
  logger.info({ requestId: req.requestId, method: req.method, url: req.url }, "request");
  next();
}
