import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile } from "./auth";
import { createAuthClient } from "./supabase-auth";

export async function getServerAuth({ writable = false } = {}) {
  const store = await cookies();
  return createAuthClient({
    getAll: () => store.getAll(),
    setAll(updates) {
      // The proxy persists refreshes for Server Components.
      if (!writable) return;
      for (const { name, value, options } of updates) {
        store.set(name, value, options);
      }
    },
  });
}

export const getSession = cache(async () => {
  const client = await getServerAuth();
  if (!client) return { configured: false, profile: null };

  const { data, error } = await client.auth.getClaims();
  const claims = error ? null : data?.claims;
  if (!claims?.sub || !claims.email) {
    return { configured: true, profile: null };
  }

  const email = claims.email;
  const metadata = claims.user_metadata;
  const name = [metadata?.name, metadata?.full_name].find(
    (value): value is string => typeof value === "string" && !!value.trim(),
  );
  const profile: Profile = {
    id: claims.sub,
    name:
      name?.trim() ||
      (email === "noordshopbr@gmail.com" ? "Noord Shop" : email),
    email,
  };
  return { configured: true, profile };
});

export async function requireProfile() {
  const { profile } = await getSession();
  if (!profile) redirect("/login");
  return profile;
}
