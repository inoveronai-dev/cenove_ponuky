import { redirect } from "next/navigation";
import { PricingForm } from "@/components/settings/pricing-form";
import { getWorkspaceContext } from "@/lib/workspace";

export default async function PricingPage() {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");
  if (!ctx.pricing) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p>Cenník sa ešte nevytvoril. Skúste sa odhlásiť a znova prihlásiť.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Cenník</h1>
        <p className="mt-1 text-muted-foreground">
          Nastavte sadzby, príplatky a rozpätie odhadu.
        </p>
      </div>
      <PricingForm pricing={ctx.pricing} />
    </div>
  );
}
