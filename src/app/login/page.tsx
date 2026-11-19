import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/login-screen";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Entrar · Maney" };

export default async function LoginPage() {
  const { profile, configured } = await getSession();
  if (profile) redirect("/");
  return <LoginScreen configured={configured} />;
}
