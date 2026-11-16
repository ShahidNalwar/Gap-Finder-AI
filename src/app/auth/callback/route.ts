import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const headers = { "Cache-Control": "private, no-store" };

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/upload", request.url), { headers });
    }
  }

  return NextResponse.redirect(new URL("/login?confirmation=failed", request.url), { headers });
}
