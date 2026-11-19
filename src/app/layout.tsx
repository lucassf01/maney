import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "@/components/reactframe/sidebar.css";
export const metadata: Metadata = {
  title: "maney · Seu financeiro, em ordem",
  description:
    "Um financeiro simples para quem presta serviços. Contas a pagar, a receber, fluxo de caixa e DRE.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
