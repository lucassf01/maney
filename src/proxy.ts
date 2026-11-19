import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient } from "@/lib/supabase-auth";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const client = createAuthClient({
    getAll: () => request.cookies.getAll(),
    setAll(updates, headers) {
      for (const { name, value } of updates) request.cookies.set(name, value);
      const refreshed = NextResponse.next({ request });
      for (const cookie of response.cookies.getAll())
        refreshed.cookies.set(cookie);
      for (const { name, value, options } of updates) {
        refreshed.cookies.set(name, value, options);
      }
      for (const [name, value] of Object.entries(headers)) {
        refreshed.headers.set(name, value);
      }
      response = refreshed;
    },
  });
  await client?.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/|brand/|favicon.ico|icon.png|apple-icon.png).*)"],
};
