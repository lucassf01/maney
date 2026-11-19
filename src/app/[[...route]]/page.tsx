import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
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
    ].includes(path)
  )
    notFound();
  return <Workspace page={path} />;
}
