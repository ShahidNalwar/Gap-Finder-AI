import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const authenticated = !error && !!data?.claims.sub;
  const pathname = request.nextUrl.pathname;
  const publicRoute = pathname === "/login" || pathname === "/auth/callback";

  if (!authenticated && !publicRoute) {
    if (pathname.startsWith("/api/")) {
      response = copyCookies(
        response,
        NextResponse.json({ error: "Please log in to continue." }, { status: 401 }),
      );
    } else {
      const destination = request.nextUrl.clone();
      destination.pathname = "/login";
      destination.search = "";
      response = copyCookies(response, NextResponse.redirect(destination));
    }
  } else if (authenticated && pathname === "/login") {
    response = copyCookies(
      response,
      NextResponse.redirect(new URL("/upload", request.url)),
    );
  }

  // Auth responses must never be shared by a CDN, including on redirects.
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
