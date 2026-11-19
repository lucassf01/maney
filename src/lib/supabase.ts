import { createClient } from "@supabase/supabase-js";
import { validateData, type FinanceData } from "./finance";

// Prepared adapter; deliberately not activated in local demonstration mode.
export function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error("Configure as variáveis públicas do seu projeto Supabase.");
  return createClient(url, key);
}
export async function readCloudWorkspace() {
  const client = supabaseClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) throw new Error("Autenticação necessária.");
  const { data, error } = await client
    .from("workspaces")
    .select("data, revision")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  validateData(data.data);
  return { workspace: data.data, revision: data.revision as number };
}
export async function writeCloudWorkspace(
  workspace: FinanceData,
  revision?: number,
) {
  validateData(workspace);
  const client = supabaseClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) throw new Error("Autenticação necessária.");
  const query =
    revision === undefined
      ? client.from("workspaces").insert({ user_id: user.id, data: workspace })
      : client
          .from("workspaces")
          .update({ data: workspace })
          .eq("user_id", user.id)
          .eq("revision", revision);
  const { data, error } = await query.select("revision").maybeSingle();
  if (error) throw error;
  if (!data)
    throw new Error(
      "Os dados mudaram em outro dispositivo. Atualize antes de salvar.",
    );
  return data.revision as number;
}
