import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { requireProfile } from "@/lib/session";
export default async function Page({
  params,
}: {
  params: Promise<{ route?: string[] }>;
}) {
  const { route } = await params;
  const path = route?.join("/") ?? "";
  if (
    ![
      "",
      "pagar",
      "receber",
      "fluxo-de-caixa",
      "dre",
      "contatos",
      "contas",
      "categorias",
      "configuracoes",
      "perfil",
    ].includes(path)
  )
    notFound();
  const profile = await requireProfile();
  return <Workspace page={path} profile={profile} />;
}
