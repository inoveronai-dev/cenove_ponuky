import { redirect } from "next/navigation";
import { QuoteForm } from "@/components/quotes/quote-form";
import { mapPricingSettings } from "@/lib/pricing/mapPricingSettings";
import { getWorkspaceContext } from "@/lib/workspace";

export default async function NewQuotePage() {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Nová ponuka</h1>
        <p className="mt-1 text-muted-foreground">
          Vyplňte základné údaje — odhad a text sa pripravia automaticky.
        </p>
      </div>
      <QuoteForm pricing={mapPricingSettings(ctx.pricing)} mode="create" />
    </div>
  );
}
