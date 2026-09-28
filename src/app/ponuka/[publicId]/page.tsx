import type { Metadata } from "next";
import { Check } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BRAND, CLIENT_BRAND } from "@/lib/brand";
import { getPublicQuoteByPublicId } from "@/lib/quotes/data";
import { toPublicQuoteDto } from "@/lib/quotes/public-dto";
import type { Quote } from "@/types/database";
import { QuoteViewTracker } from "@/components/public/quote-view-tracker";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export const dynamic = "force-dynamic";

export default async function PublicQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { publicId } = await params;
  const { d } = await searchParams;
  const result = await getPublicQuoteByPublicId(publicId, d);

  if (!result) {
    return (
      <div className="brand-surface mx-auto flex min-h-screen max-w-lg items-center px-6 py-24 text-center">
        <div>
          <h1 className="font-display text-2xl text-[var(--brand-ink)]">
            Táto cenová ponuka neexistuje alebo už nie je dostupná.
          </h1>
        </div>
      </div>
    );
  }

  const { quote, company } = result;
  const dto = toPublicQuoteDto(quote as Quote, company);
  const brand = dto.company.primaryColor || CLIENT_BRAND.primary;
  const brandDark = CLIENT_BRAND.primaryDark;

  const included = [
    { show: dto.montaz, label: "Montáž" },
    { show: dto.demontazStarych, label: "Demontáž starých okien/dverí" },
    { show: dto.likvidacia, label: "Likvidácia starých výplní" },
    { show: dto.parapetVnutorny, label: "Vnútorné parapety" },
    { show: dto.parapetVonkajsi, label: "Vonkajšie parapety" },
    { show: dto.sieteProtiHmyzu, label: "Siete proti hmyzu" },
    { show: dto.otherService, label: "Iné práce" },
    { show: true, label: "Odborné poradenstvo" },
    { show: true, label: "Zameranie" },
    { show: true, label: "Dodávka na miesto" },
  ].filter((i) => i.show);

  const facts = [
    { label: "Adresa montáže", value: dto.siteAddress || null },
    { label: "Typ objektu", value: dto.propertyTypeLabel || null },
    {
      label: "Poschodie",
      value: dto.floor != null ? `${dto.floor}. poschodie` : null,
    },
    { label: "Termín montáže", value: dto.installDate ? dto.installDateLabel : null },
  ].filter((f) => f.value);

  return (
    <div className="brand-surface min-h-screen text-[var(--brand-ink)]">
      <QuoteViewTracker publicId={publicId} />

      <section
        className="relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(155deg, ${brand} 0%, ${brandDark} 48%, #152a48 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full opacity-30"
          style={{ background: CLIENT_BRAND.accent }}
          aria-hidden
        />
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-10 md:px-8 md:pb-24 md:pt-14">
          <div className="animate-fade-up flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {dto.company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dto.company.logoUrl}
                  alt={dto.company.name}
                  className="h-11 w-auto rounded-md bg-white object-contain p-1.5 shadow-sm"
                />
              ) : (
                <div className="rounded-md bg-white px-2 py-1.5">
                  <BrandLogo height={32} />
                </div>
              )}
              <div>
                <p className="text-sm font-medium tracking-wide">
                  {dto.company.name}
                </p>
                {dto.company.subtitle && (
                  <p className="text-xs text-blue-100/70">
                    {dto.company.subtitle}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-100/60">
              Cenová ponuka #{dto.publicId}
            </p>
          </div>

          <h1 className="font-display animate-fade-up mt-12 max-w-3xl text-4xl leading-[1.08] md:text-5xl lg:text-6xl">
            {BRAND.heroTitle}
          </h1>

          {dto.aiIntro && (
            <p className="animate-fade-up-delay mt-8 max-w-2xl whitespace-pre-line text-base leading-relaxed text-blue-50/85 md:text-lg">
              {dto.aiIntro}
            </p>
          )}

          <div className="animate-fade-up-delay mt-12 flex flex-col gap-4 rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-blue-100/55">
                Adresa montáže
              </p>
              <p className="mt-1 text-lg font-medium">
                {dto.siteAddress || "—"}
              </p>
            </div>
            {dto.installDate && (
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-100/55">
                  Termín montáže
                </p>
                <p className="mt-1 text-lg font-medium">{dto.installDateLabel}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl space-y-16 px-5 py-14 md:px-8 md:py-20">
        <section className="animate-fade-up">
          <h2 className="font-display text-3xl text-[var(--brand-ink)] md:text-4xl">
            Čo sme pochopili
          </h2>
          {dto.aiSummary && (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {dto.aiSummary}
            </p>
          )}
          {facts.length > 0 && (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label} className="brand-grid-card p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {fact.label}
                  </p>
                  <p className="mt-2 font-medium text-[var(--brand-ink)]">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {dto.lineItems.length > 0 && (
          <section>
            <h2 className="font-display text-3xl text-[var(--brand-ink)] md:text-4xl">
              Položky ponuky
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {dto.lineItems.map((item, index) => (
                <li
                  key={`${item.category}-${item.sizeLabel}-${index}`}
                  className="brand-grid-card px-4 py-3 text-[var(--brand-ink)]"
                >
                  <p className="font-medium">{item.categoryLabel}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[
                      `${item.count}×`,
                      item.sizeLabel,
                      item.color,
                      item.glazingLabel || null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="font-display text-3xl text-[var(--brand-ink)] md:text-4xl">
            Čo je zahrnuté
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {included.map((item) => (
              <div
                key={item.label}
                className="brand-grid-card flex items-start gap-3 px-4 py-3"
              >
                <span
                  className="mt-0.5 rounded-sm p-1 text-white"
                  style={{ backgroundColor: CLIENT_BRAND.accent }}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section
          className="rounded-lg px-6 py-10 text-white md:px-10 md:py-14"
          style={{
            background: `linear-gradient(135deg, ${brandDark} 0%, ${brand} 70%, ${CLIENT_BRAND.accent} 160%)`,
          }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-blue-100/60">
            Orientačný cenový odhad
          </p>
          <p className="mt-4 font-display text-5xl leading-none md:text-6xl">
            {dto.priceRangeLabel}
          </p>
          <p className="mt-4 text-blue-50/90">
            Predpokladaná cena za dodávku a montáž.
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-blue-100/65">
            {dto.aiScopeNote ||
              "Cena vychádza z uvedených rozmerov a služieb. Presná suma sa potvrdí po zameraní na mieste."}
          </p>
        </section>

        <section className="brand-grid-card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-[var(--brand-ink)]">
            Dôležité informácie
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Táto cenová ponuka je orientačná a slúži ako predbežný cenový odhad.
            Konečná cena sa potvrdí po zameraní — rozmery a podmienky na mieste
            môžu ovplyvniť výslednú sumu.
          </p>
          {dto.customerNotes && (
            <p className="mt-4 text-sm text-[var(--brand-ink)]">
              <span className="font-medium">Poznámka: </span>
              {dto.customerNotes}
            </p>
          )}
          {dto.validUntil && (
            <p className="mt-4 text-sm text-muted-foreground">
              Platnosť ponuky do {dto.validUntilLabel}
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto grid max-w-4xl gap-2 px-5 py-10 text-sm text-muted-foreground md:px-8">
          <div className="mb-2">
            <BrandLogo height={28} />
          </div>
          <p className="text-base font-semibold text-[var(--brand-ink)]">
            {dto.company.name}
          </p>
          {dto.company.address && <p>{dto.company.address}</p>}
          <p>
            {[
              dto.company.ico ? `IČO ${dto.company.ico}` : null,
              dto.company.dic ? `DIČ ${dto.company.dic}` : null,
              dto.company.icDph ? `IČ DPH ${dto.company.icDph}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p>
            {[dto.company.phone, dto.company.email, dto.company.website]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </footer>
    </div>
  );
}
