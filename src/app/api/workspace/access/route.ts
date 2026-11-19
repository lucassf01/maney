import { getServerAuth } from "@/lib/session";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  // This credential is for same-origin application requests, never navigation.
  if (request.headers.get("X-Maney-Workspace") !== "1") {
    return new Response(null, { status: 403, headers });
  }

  const client = await getServerAuth({ writable: true });
  const session = await client?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!client || !token) return new Response(null, { status: 401, headers });

  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims.sub || data.claims.role !== "authenticated") {
    return new Response(null, { status: 401, headers });
  }

  return Response.json({ token, userId: data.claims.sub }, { headers });
}
