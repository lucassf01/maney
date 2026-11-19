import { createClient } from "@supabase/supabase-js";
import { validateData, type FinanceData } from "./finance";

export type CloudWorkspace = { data: FinanceData; revision: number | null };

export class WorkspaceConflict extends Error {
  constructor() {
    super(
      "Os dados mudaram em outro dispositivo. Feche a edição e atualize a página antes de tentar novamente.",
    );
  }
}

export function cloudWorkspace(userId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Conexão com o Supabase indisponível.");

  // Send workspaces directly to Supabase so backups and attachments do not pass
  // through the Vercel request size limit. Only the current access token is used.
  const makeClient = () =>
    createClient(url, key, {
      accessToken: async () => {
        const response = await fetch("/api/workspace/access", {
          headers: { "X-Maney-Workspace": "1" },
          cache: "no-store",
        });
        if (!response.ok) return null;
        const access = await response.json();
        return access.userId === userId && typeof access.token === "string"
          ? access.token
          : null;
      },
    });
  let client: ReturnType<typeof makeClient> | undefined;
  const table = () => (client ??= makeClient()).from("workspaces");

  return {
    async read(
      afterRevision: number | null = null,
    ): Promise<CloudWorkspace | null> {
      const query = table().select("data, revision").eq("user_id", userId);
      const { data, error } = await (
        afterRevision === null ? query : query.gt("revision", afterRevision)
      ).maybeSingle();
      if (error)
        throw new Error(
          "Não foi possível abrir os dados no Supabase. Confira sua conexão e tente novamente.",
        );
      if (!data) return null;
      validateData(data.data);
      return { data: data.data, revision: data.revision };
    },
    async write(
      data: FinanceData,
      revision: number | null,
    ): Promise<CloudWorkspace> {
      validateData(data);
      const query =
        revision === null
          ? table().insert({ user_id: userId, data })
          : table()
              .update({ data })
              .eq("user_id", userId)
              .eq("revision", revision);
      const result = await query.select("revision").maybeSingle();
      if (result.error?.code === "23505" || (!result.error && !result.data)) {
        throw new WorkspaceConflict();
      }
      if (result.error || !result.data) {
        throw new Error(
          "Não foi possível salvar no Supabase. Confira sua conexão e tente novamente.",
        );
      }
      return { data, revision: result.data.revision };
    },
    async previous(): Promise<FinanceData | null> {
      const { data, error } = await table()
        .select("previous_data")
        .eq("user_id", userId)
        .maybeSingle();
      if (error)
        throw new Error(
          "Não foi possível baixar a cópia anterior. Tente novamente.",
        );
      if (!data?.previous_data) return null;
      validateData(data.previous_data);
      return data.previous_data;
    },
  };
}
