import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BRAND, CLIENT_BRAND } from "@/lib/brand";
import { isDemoMode } from "@/lib/demo/mode";
import { Button } from "@/components/ui/button";
import { EnterDemoButton } from "@/components/demo/enter-demo-button";

export default function HomePage() {
  const demo = isDemoMode();

  return (
    <div className="brand-surface min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <BrandLogo height={40} />
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/login">Prihlásiť sa</Link>
          </Button>
          {demo ? (
            <EnterDemoButton />
          ) : (
            <Button asChild>
              <Link href="/register">Vyskúšať</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up max-w-2xl">
            {demo && (
              <p className="mb-4 inline-flex rounded-md border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-[var(--brand-blue)]">
                Demo pre {CLIENT_BRAND.legalName} · bez Supabase
              </p>
            )}
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-[var(--brand-blue)]">
              {BRAND.name} × {CLIENT_BRAND.name}
            </p>
            <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-[var(--brand-ink)] md:text-5xl lg:text-6xl">
              Profesionálne webové ponuky v štýle vašej značky.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Vytvorte odhad za menej ako minútu, pošlite unikátny odkaz a
              sledujte, či zákazník ponuku otvoril — v vizuáli {CLIENT_BRAND.name}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {demo ? (
                <EnterDemoButton size="lg" />
              ) : (
                <Button asChild size="lg">
                  <Link href="/register">Vytvoriť účet</Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Prihlásiť sa</Link>
              </Button>
            </div>
          </div>

          <div className="animate-fade-up-delay relative hidden overflow-hidden rounded-lg border border-border bg-white p-8 shadow-sm lg:block">
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  ["T", CLIENT_BRAND.primary],
                  ["O", CLIENT_BRAND.primary],
                  ["P", CLIENT_BRAND.primary],
                  ["O", CLIENT_BRAND.accent],
                ] as const
              ).map(([letter, bg]) => (
                <div
                  key={`${letter}-${bg}`}
                  className="flex aspect-square items-center justify-center font-display text-5xl text-white"
                  style={{ backgroundColor: bg }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="mt-6 font-display text-3xl text-[var(--brand-ink)]">
              kno
              <sup className="ml-1 text-base">TN</sup>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Modrá dôvera · zelený akcent · jasná štruktúra
            </p>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3 animate-fade-up-delay">
          {[
            {
              title: "Vytvoriť",
              body: "Rýchly formulár, živý odhad ceny a profesionálny text.",
            },
            {
              title: "Odoslať",
              body: "Unikátna webová ponuka, ktorú zákazník otvorí na mobile.",
            },
            {
              title: "Sledovať",
              body: "Vidíte otvorenia a dostanete notifikáciu pri prvej návšteve.",
            },
          ].map((item) => (
            <div key={item.title} className="brand-grid-card p-6">
              <div
                className="mb-4 h-1 w-10 rounded-sm"
                style={{
                  background:
                    item.title === "Odoslať"
                      ? CLIENT_BRAND.accent
                      : CLIENT_BRAND.primary,
                }}
              />
              <h2 className="font-display text-xl text-[var(--brand-ink)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
