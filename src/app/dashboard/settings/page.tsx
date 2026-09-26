import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { getWorkspaceContext } from "@/lib/workspace";

export default async function SettingsPage() {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Nastavenia</h1>
        <p className="mt-1 text-muted-foreground">
          Firemný profil, branding a notifikácie. Všetky údaje sú editovateľné.
        </p>
      </div>
      <SettingsForm company={ctx.company} />
    </div>
  );
}
