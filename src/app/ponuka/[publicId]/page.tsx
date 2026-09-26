import type { Metadata } from "next";
import { Check } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BRAND, CLIENT_BRAND, vehicleTypeLabel } from "@/lib/brand";
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

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const result = await getPublicQuoteByPublicId(publicId);

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
    { show: true, label: "Naloženie vecí" },
    { show: true, label: "Vyloženie vecí" },
    { show: true, label: "Preprava medzi adresami" },
    { show: true, label: "Bezpečné uloženie nábytku počas prevozu" },
    { show: true, label: "Manipulácia" },
    { show: dto.disassembly, label: "Demontáž nábytku" },
    { show: dto.assembly, label: "Montáž nábytku" },
    { show: dto.packing, label: "Balenie" },
    { show: dto.packingMaterial, label: "Baliaci materiál" },
    { show: dto.protectiveWrapping, label: "Ochranné balenie nábytku" },
    { show: dto.heavyItems, label: "Sťahovanie ťažkých predmetov" },
    { show: dto.disposal, label: "Odvoz nepotrebného nábytku" },
  ].filter((i) => i.show);

  const facts = [
    { label: "Termín", value: dto.moveDate ? dto.moveDateLabel : null },
    { label: "Typ priestoru", value: dto.originPropertyTypeLabel || null },
    { label: "Odkiaľ", value: dto.originAddress },
    { label: "Kam", value: dto.destinationAddress },
    {
      label: "Poschodie",
      value: dto.originFloor != null ? `${dto.originFloor}. poschodie` : null,
    },
    {
      label: "Výťah",
      value:
        dto.originElevator == null
          ? null
          : dto.originElevator
            ? "Áno"
            : "Nie",
    },
    {
      label: "Počet krabíc",
      value: dto.boxCount != null ? String(dto.boxCount) : null,
    },
    {
      label: "Vzdialenosť",
      value: dto.distanceKm != null ? `${dto.distanceKm} km` : null,
    },
  ].filter((f) => f.value);

  const items: string[] = [];
  if (dto.boxCount != null) items.push(`Približne ${dto.boxCount} krabíc`);
  if (dto.largeItems) {
    dto.largeItems
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((item) =>
        items.push(item.charAt(0).toUpperCase() + item.slice(1))
      );
  }
  if (dto.wardrobesCount) items.push(`${dto.wardrobesCount}× skriňa`);
  if (dto.bedsCount) items.push(`${dto.bedsCount}× posteľ`);
  if (dto.sofasCount) items.push(`${dto.sofasCount}× sedačka`);
  if (dto.appliancesCount) items.push(`${dto.appliancesCount}× spotrebič`);

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
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-blue-100/55">
                  Odkiaľ
                </p>
                <p className="mt-1 text-lg font-medium">
                  {dto.originAddress || "—"}
                </p>
              </div>
              <div className="hidden text-blue-100/50 sm:block" aria-hidden>
                →
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-blue-100/55">
                  Kam
                </p>
                <p className="mt-1 text-lg font-medium">
                  {dto.destinationAddress || "—"}
                </p>
              </div>
            </div>
            {dto.moveDate && (
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-100/55">
                  Termín
                </p>
                <p className="mt-1 text-lg font-medium">{dto.moveDateLabel}</p>
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

        {items.length > 0 && (
          <section>
            <h2 className="font-display text-3xl text-[var(--brand-ink)] md:text-4xl">
              Čo budeme sťahovať
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <li
                  key={item}
                  className="brand-grid-card px-4 py-3 text-[var(--brand-ink)]"
                >
                  {item}
                </li>
              ))}
            </ul>
            {(dto.workers || dto.estimatedHours || dto.vehicleType) && (
              <p className="mt-4 text-sm text-muted-foreground">
                {[
                  dto.workers ? `${dto.workers} pracovníci` : null,
                  dto.estimatedHours
                    ? `približne ${dto.estimatedHours} h`
                    : null,
                  dto.vehicleType ? vehicleTypeLabel(dto.vehicleType) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
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
            Predpokladaná cena za celé sťahovanie.
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-blue-100/65">
            {dto.aiScopeNote ||
              "Cena vychádza z informácií uvedených vyššie. Presná suma závisí od skutočného objemu vecí, prístupnosti oboch adries a reálneho času realizácie."}
          </p>
        </section>

        <section className="brand-grid-card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-[var(--brand-ink)]">
            Dôležité informácie
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Táto cenová ponuka je orientačná a slúži ako predbežný cenový odhad.
            Ak sa rozsah sťahovania, počet vecí alebo podmienky na mieste výrazne
            zmenia, môže sa primerane zmeniť aj konečná cena.
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
