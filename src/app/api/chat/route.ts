import { z } from "zod";
import { apiUser, apiError, AppError } from "@/lib/api";
import { answerFromMaterial } from "@/lib/chat/answer";
import type { chatEventSchema } from "@/lib/chat/schema";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const { supabase } = await apiUser(request);
    const input = z.object({ message: z.string().trim().min(2).max(1200) }).parse(await request.json());
    const encoder = new TextEncoder();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: z.infer<typeof chatEventSchema>) => {
          if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };
        try {
          send({ type: "status", message: "Searching your material and checking whether it answers the question…" });
          const answer = await answerFromMaterial(supabase, input.message);
          // Never stream unvalidated model tokens; only the validated answer reaches the browser.
          send({ type: "answer", data: answer });
        } catch (error) {
          send({ type: "error", message: error instanceof AppError ? error.message : "Couldn't explain this topic. Please try again." });
        } finally { if (!cancelled) controller.close(); }
      },
      cancel() { cancelled = true; },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) { return apiError(error); }
}
