import { Provider } from "@/components/provider";
import { requireProfile } from "@/lib/session";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  return (
    <Provider
      key={profile.id}
      userId={profile.id}
      allowLegacyImport={profile.email === "noordshopbr@gmail.com"}
    >
      {children}
    </Provider>
  );
}
