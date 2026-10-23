import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const ok = <T,>(data: T, status = 200) => NextResponse.json({ ok: true, data }, { status });
export const fail = (message: string, status = 400, details?: unknown) =>
  NextResponse.json({ ok: false, error: { message, details } }, { status });

export function handleError(e: unknown) {
  if (e instanceof HttpError) return fail(e.message, e.status);
  if (e instanceof ZodError) return fail("Invalid input", 422, e.flatten().fieldErrors);
  const msg = e instanceof Error ? e.message : "unknown error";
  console.error("[api]", msg);
  return fail("Something went wrong", 500, process.env.NODE_ENV !== "production" ? msg : undefined);
}

/** Wraps a route handler so every thrown error becomes a safe JSON response. */
export const route =
  <A extends unknown[]>(fn: (...args: A) => Promise<Response>) =>
  async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      return handleError(e);
    }
  };

  