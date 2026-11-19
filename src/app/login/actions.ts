"use server";

import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/session";

export async function signIn(
  _previous: string,
  form: FormData,
): Promise<string> {
  const email = form.get("email");
  const password = form.get("password");
  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return "Preencha o e-mail e a senha.";
  }

  const client = await getServerAuth({ writable: true });
  if (!client) return "O login ainda não foi configurado.";

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.session) {
    if (error?.code === "over_request_rate_limit") {
      return "Muitas tentativas. Aguarde um pouco e tente novamente.";
    }
    if (error?.status === 0 || (error?.status ?? 0) >= 500) {
      return "Não foi possível validar o acesso. Tente novamente.";
    }
    return "E-mail ou senha incorretos.";
  }

  redirect("/");
}

export async function signOut(): Promise<string> {
  const client = await getServerAuth({ writable: true });
  const result = await client?.auth.signOut({ scope: "local" });
  if (result?.error) return "Não foi possível sair. Tente novamente.";
  redirect("/login");
}
