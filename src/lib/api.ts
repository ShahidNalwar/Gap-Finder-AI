import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export class AppError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function apiUser(request?: Request) {
  if (request && request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      throw new AppError("Invalid request origin.", 403);
    }
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) throw new AppError("Please log in to continue.", 401);
  return { supabase, userId: data.claims.sub };
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function apiError(error: unknown) {
  if (error instanceof AppError) return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return json({ error: "Please check your input and try again." }, 400);
  }
  return json({ error: "Something went wrong. Please try again." }, 500);
}

export function checkDb(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (["42P01", "42703", "PGRST202", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    throw new AppError("Database setup is incomplete. Run supabase/schema.sql for a new project, or the scripts in supabase/migrations for an existing project.", 503);
  }
  if (error.code === "23503") {
    throw new AppError("This material is used by a saved attempt and cannot be replaced. Your previous results have been preserved.", 409);
  }
  if (error.code === "23505") throw new AppError("This action has already been saved. Refresh the page.", 409);
  throw new AppError("Couldn't save or load your data. Please try again.", 503);
}

export const kindSchema = z.enum(["syllabus", "notes", "past_paper"]);
export type DocumentKind = z.infer<typeof kindSchema>;
export type DbClient = Awaited<ReturnType<typeof createClient>>;
