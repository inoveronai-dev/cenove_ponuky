import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QUOTE_STATUSES } from "@/lib/brand";
import { getQuoteById, getQuoteViews } from "@/lib/quotes/data";
import { publicQuoteUrl } from "@/lib/quotes/public-id";
import {
  formatCurrency,
  formatDateSk,
  formatDateTimeSk,
} from "@/lib/utils";
import { getWorkspaceContext } from "@/lib/workspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteActions } from "@/components/quotes/quote-actions";
import { SendQuoteEmailButton } from "@/components/quotes/send-email-button";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");

  const { id } = await params;
  const quote = await getQuoteById(id, ctx.company.id);
  if (!quote) notFound();

  const timeline = await getQuoteViews(quote.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {quote.customer_name}
            </h1>
            <Badge>{QUOTE_STATUSES[quote.status]}</Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Ponuka #{quote.public_id} · vytvorená{" "}
            {formatDateTimeSk(quote.created_at)}
          </p>
          <p className="mt-2 text-sm">
            Verejný link:{" "}
            <Link
              href={`/ponuka/${quote.public_id}`}
              className="underline"
              target="_blank"
            >
              {publicQuoteUrl(quote.public_id)}
            </Link>
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <QuoteActions quote={quote} />
          <SendQuoteEmailButton
            quoteId={quote.id}
            disabled={!quote.customer_email}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zákazník a trasa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">E-mail: </span>
              {quote.customer_email || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Telefón: </span>
              {quote.customer_phone || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Trasa: </span>
              {[quote.origin_address, quote.destination_address]
                .filter(Boolean)
                .join(" → ") || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Termín: </span>
              {formatDateSk(quote.move_date)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cenový prehľad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Práca: {formatCurrency(Number(quote.labor_amount || 0))}</p>
            <p>Doprava: {formatCurrency(Number(quote.transport_amount || 0))}</p>
            <p>Doplnky: {formatCurrency(Number(quote.extras_amount || 0))}</p>
            <p className="pt-2 text-lg font-semibold">
              {quote.price_min != null && quote.price_max != null
                ? `${formatCurrency(quote.price_min)} – ${formatCurrency(quote.price_max)}`
                : "—"}
            </p>
            {quote.price_is_manual ? (
              <p className="text-xs text-amber-700">Cena nastavená manuálne</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Interný základ: {formatCurrency(Number(quote.base_estimate || 0))}
              </p>
            )}
            {quote.price_is_manual && (
              <p className="text-xs text-muted-foreground">
                Výpočet systému (referencia):{" "}
                {formatCurrency(Number(quote.base_estimate || 0))}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sledovanie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Celkový počet otvorení: {quote.view_count}</p>
            <p>Prvé otvorenie: {formatDateTimeSk(quote.first_viewed_at)}</p>
            <p>Posledné otvorenie: {formatDateTimeSk(quote.last_viewed_at)}</p>
            <p>Odoslané: {formatDateTimeSk(quote.sent_at)}</p>
            <p>Platnosť do: {formatDateSk(quote.valid_until)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parametre sťahovania</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Hodiny: {quote.estimated_hours ?? "—"}</p>
            <p>Pracovníci: {quote.workers ?? "—"}</p>
            <p>
              Vzdialenosť:{" "}
              {quote.distance_km != null ? `${quote.distance_km} km` : "—"}
            </p>
            <p>Krabice: {quote.box_count ?? "—"}</p>
            <p>Veľké položky: {quote.large_items || "—"}</p>
            {quote.internal_notes && (
              <p className="pt-2 text-muted-foreground">
                Interné: {quote.internal_notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktivita</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Zákazník zatiaľ ponuku neotvoril.
              </p>
            ) : (
              <ol className="space-y-4">
                {timeline.map((view, index) => (
                  <li key={view.id} className="flex gap-3 text-sm">
                    <div className="w-16 shrink-0 text-muted-foreground">
                      {new Date(view.viewed_at).toLocaleTimeString("sk-SK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div>
                      {index === 0
                        ? "Klient prvýkrát otvoril cenovú ponuku."
                        : index === 1
                          ? "Ponuka bola otvorená znova."
                          : `Ponuka bola otvorená ${index + 1}. krát.`}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTimeSk(view.viewed_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
