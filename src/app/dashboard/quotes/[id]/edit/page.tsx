import { notFound, redirect } from "next/navigation";
import { QuoteForm } from "@/components/quotes/quote-form";
import { mapPricingSettings } from "@/lib/pricing/mapPricingSettings";
import { getQuoteById } from "@/lib/quotes/data";
import { getWorkspaceContext } from "@/lib/workspace";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");

  const { id } = await params;
  const quote = await getQuoteById(id, ctx.company.id);
  if (!quote) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Upraviť ponuku</h1>
        <p className="mt-1 text-muted-foreground">
          {quote.customer_name} · #{quote.public_id}
        </p>
      </div>
      <QuoteForm
        pricing={mapPricingSettings(ctx.pricing)}
        quote={quote}
        mode="edit"
      />
    </div>
  );
}
