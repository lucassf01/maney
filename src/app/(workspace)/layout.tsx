import { Provider } from "@/components/provider";
import { requireProfile } from "@/lib/session";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile();
  return <Provider>{children}</Provider>;
}
