import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isConfigured, supabaseConfig } from "@/lib/supabase/config";
export async function proxy(request: NextRequest) {
  const protectedRoute = request.nextUrl.pathname.startsWith("/admin");
  if (!isConfigured())
    return protectedRoute
      ? NextResponse.redirect(new URL("/login", request.url))
      : NextResponse.next();
  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const { data, error } = await supabase.auth.getClaims();
  if (
    protectedRoute &&
    (error || !data?.claims?.sub || data.claims.is_anonymous)
  ) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/admin/:path*", "/login"] };
