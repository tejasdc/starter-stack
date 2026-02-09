import type { Context } from "hono";
import { ZodError } from "zod";
import { logger } from "./logger.js";

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(opts: { code: ErrorCode; status: number; message: string; details?: unknown }) {
    super(opts.message);
    this.code = opts.code;
    this.status = opts.status;
    this.details = opts.details;
  }
}

export function badRequest(message: string, details?: unknown) {
  return new AppError({ code: "BAD_REQUEST", status: 400, message, details });
}

export function unauthorized(message = "Unauthorized") {
  return new AppError({ code: "UNAUTHORIZED", status: 401, message });
}

export function notFound(resource: string, id?: string) {
  return new AppError({
    code: "NOT_FOUND",
    status: 404,
    message: `${resource} not found`,
    details: id ? { resource, id } : { resource },
  });
}

export function conflict(message: string, details?: unknown) {
  return new AppError({ code: "CONFLICT", status: 409, message, details });
}

export function validationError(message = "Validation failed", details?: unknown) {
  return new AppError({ code: "VALIDATION_ERROR", status: 422, message, details });
}

export function rateLimited(message = "Rate limited", details?: unknown) {
  return new AppError({ code: "RATE_LIMITED", status: 429, message, details });
}

export function internalError(message = "Internal error", details?: unknown) {
  return new AppError({ code: "INTERNAL_ERROR", status: 500, message, details });
}

export function serviceUnavailable(message: string, details?: unknown) {
  return new AppError({ code: "SERVICE_UNAVAILABLE", status: 503, message, details });
}

export function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  if ("code" in err && (err as any).code === "23505") return true;
  if ("cause" in err && typeof (err as any).cause === "object" && (err as any).cause !== null) {
    return (err as any).cause.code === "23505";
  }
  return false;
}

export function toErrorResponse(c: Context, err: unknown): Response {
  const requestId =
    (c.get("requestId" as any) as string | undefined) ??
    c.req.header("x-request-id") ??
    undefined;

  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message, status: err.status, details: err.details, requestId } },
      err.status as any,
    );
  }

  if (err instanceof ZodError) {
    const e = validationError("Validation failed", err.issues);
    return c.json(
      { error: { code: e.code, message: e.message, status: e.status, details: e.details, requestId } },
      e.status as any,
    );
  }

  logger.error({ err, requestId }, "Unhandled error");
  return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal error", status: 500, requestId } }, 500);
}
