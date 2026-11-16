import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims.sub) {
    return NextResponse.json({ error: "Please log in to continue." }, { status: 401, headers });
  }

  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    return NextResponse.json({ error: "Couldn't sign out. Please try again." }, { status: 500, headers });
  }
  return NextResponse.json({ ok: true }, { headers });
}
