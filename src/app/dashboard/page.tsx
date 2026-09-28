import Link from "next/link";
import { redirect } from "next/navigation";
import { QUOTE_STATUSES } from "@/lib/brand";
import { quoteSharePath } from "@/lib/quotes/public-id";
import { formatCurrency, formatDateSk, formatDateTimeSk } from "@/lib/utils";
import { getCompanyQuotes, getWorkspaceContext } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuoteActions } from "@/components/quotes/quote-actions";

export default async function DashboardPage() {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");

  const quotes = await getCompanyQuotes(ctx.company.id);
  const all = quotes.length;
  const sent = quotes.filter((q) => q.status === "sent" || q.status === "opened").length;
  const opened = quotes.filter((q) => q.status === "opened").length;
  const avg =
    quotes.filter((q) => q.base_estimate != null).length > 0
      ? quotes
          .filter((q) => q.base_estimate != null)
          .reduce((sum, q) => sum + Number(q.base_estimate), 0) /
        quotes.filter((q) => q.base_estimate != null).length
      : 0;

  const recent = quotes.slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-[var(--brand-ink)]">
            Cenové ponuky
          </h1>
          <p className="mt-1 text-muted-foreground">
            Cenové odhady dodávky a montáže okien, dverí a tienenia.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/quotes/new">Nová ponuka</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Všetky ponuky", value: String(all) },
          { label: "Odoslané", value: String(sent) },
          { label: "Otvorené", value: String(opened) },
          {
            label: "Priemerná hodnota ponuky",
            value: avg ? formatCurrency(avg) : "—",
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nedávne ponuky</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recent.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <p className="font-medium">Zatiaľ nemáte žiadne ponuky</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vytvorte prvú webovú cenovú ponuku za menej ako minútu.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/quotes/new">Nová ponuka</Link>
              </Button>
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium">Klient</th>
                  <th className="pb-3 font-medium">Adresa montáže</th>
                  <th className="pb-3 font-medium">Termín montáže</th>
                  <th className="pb-3 font-medium">Cenový odhad</th>
                  <th className="pb-3 font-medium">Stav</th>
                  <th className="pb-3 font-medium">Otvorenia</th>
                  <th className="pb-3 font-medium">Posledné otvorenie</th>
                  <th className="pb-3 font-medium">Akcie</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((q) => (
                  <tr key={q.id} className="border-b border-border/70">
                    <td className="py-3 font-medium">{q.customer_name}</td>
                    <td className="py-3 text-muted-foreground">
                      {q.site_address || "—"}
                    </td>
                    <td className="py-3">{formatDateSk(q.install_date)}</td>
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
                      <QuoteActions
                        quote={q}
                        sharePath={quoteSharePath(q, ctx.company)}
                        compact
                      />
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
