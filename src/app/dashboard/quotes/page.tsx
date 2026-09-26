import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { QUOTE_STATUSES } from "@/lib/brand";
import { formatCurrency, formatDateSk, formatDateTimeSk } from "@/lib/utils";
import { getCompanyQuotes, getWorkspaceContext } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuotesFilters } from "@/components/quotes/quotes-filters";
import { QuoteActions } from "@/components/quotes/quote-actions";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");

  const params = await searchParams;
  const quotes = await getCompanyQuotes(ctx.company.id, {
    search: params.q,
    status: params.status || "all",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Cenové ponuky</h1>
          <p className="mt-1 text-muted-foreground">
            Vyhľadávanie, filtre a správa všetkých ponúk.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/quotes/new">Nová ponuka</Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <QuotesFilters />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>{quotes.length} ponúk</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Žiadne výsledky.</p>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium">Klient</th>
                  <th className="pb-3 font-medium">Trasa</th>
                  <th className="pb-3 font-medium">Termín</th>
                  <th className="pb-3 font-medium">Odhad</th>
                  <th className="pb-3 font-medium">Stav</th>
                  <th className="pb-3 font-medium">Otvorenia</th>
                  <th className="pb-3 font-medium">Posledné</th>
                  <th className="pb-3 font-medium">Akcie</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-b border-border/70">
                    <td className="py-3 font-medium">{q.customer_name}</td>
                    <td className="py-3 text-muted-foreground">
                      {[q.origin_address, q.destination_address]
                        .filter(Boolean)
                        .join(" → ") || "—"}
                    </td>
                    <td className="py-3">{formatDateSk(q.move_date)}</td>
                    <td className="py-3">
                      {q.price_min != null && q.price_max != null
                        ? `${formatCurrency(q.price_min)} – ${formatCurrency(q.price_max)}`
                        : "—"}
                    </td>
                    <td className="py-3">
                      <Badge>{QUOTE_STATUSES[q.status]}</Badge>
                    </td>
                    <td className="py-3">{q.view_count}×</td>
                    <td className="py-3">{formatDateTimeSk(q.last_viewed_at)}</td>
                    <td className="py-3">
                      <QuoteActions quote={q} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
