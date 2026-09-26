import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  INSTALL_SERVICES,
  PRODUCT_CATEGORIES,
  QUOTE_STATUSES,
  propertyTypeLabel,
} from "@/lib/brand";
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
import type { QuoteLineItem } from "@/types/database";

function lineItemSummary(items: QuoteLineItem[] | null | undefined) {
  if (!items?.length) return "—";
  return items
    .map((item) => {
      const cat =
        PRODUCT_CATEGORIES.find((c) => c.value === item.category)?.label ||
        item.category;
      return `${item.count}× ${cat} (${item.widthMm} × ${item.heightMm} mm)`;
    })
    .join(", ");
}

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

  const services = INSTALL_SERVICES.filter((s) => {
    switch (s.key) {
      case "montaz":
        return quote.montaz;
      case "demontazStarych":
        return quote.demontaz_starych;
      case "likvidacia":
        return quote.likvidacia;
      case "parapetVnutorny":
        return quote.parapet_vnutorny;
      case "parapetVonkajsi":
        return quote.parapet_vonkajsi;
      case "sieteProtiHmyzu":
        return quote.siete_proti_hmyzu;
      case "otherService":
        return quote.other_service;
      default:
        return false;
    }
  });

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
            <CardTitle className="text-base">Zákazník a montáž</CardTitle>
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
              <span className="text-muted-foreground">Adresa montáže: </span>
              {quote.site_address || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Typ objektu: </span>
              {propertyTypeLabel(quote.property_type) || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Poschodie: </span>
              {quote.floor != null ? `${quote.floor}.` : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Termín montáže: </span>
              {formatDateSk(quote.install_date)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cenový prehľad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Produkty: {formatCurrency(Number(quote.products_amount || 0))}
            </p>
            <p>Montáž: {formatCurrency(Number(quote.montaz_amount || 0))}</p>
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
            <CardTitle className="text-base">Detail ponuky</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Položky: </span>
              {lineItemSummary(quote.line_items)}
            </p>
            <p>
              <span className="text-muted-foreground">Služby: </span>
              {services.length > 0
                ? services.map((s) => s.label).join(", ")
                : "—"}
            </p>
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
