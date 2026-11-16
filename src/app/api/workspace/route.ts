import { z } from "zod";
import { apiUser, apiError, AppError, checkDb, json } from "@/lib/api";

const resetSchema = z.object({ confirmation: z.literal("DELETE MY STUDY DATA") }).strict();

export async function DELETE(request: Request) {
  try {
    const { supabase } = await apiUser(request);
    const input = resetSchema.parse(await request.json());
    // No caller-supplied user ID: the invoker function scopes every delete to auth.uid().
    const result = await supabase.rpc("reset_study_workspace", { confirmation: input.confirmation });
    if (result.error?.code === "PGRST202") {
      throw new AppError("Reset is not installed yet. Run supabase/migrations/002_reset_study_workspace.sql in the Supabase SQL Editor once. No data has been deleted.", 503);
    }
    checkDb(result.error);
    return json({ reset: true });
  } catch (error) { return apiError(error); }
}
