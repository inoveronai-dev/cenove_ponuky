"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createQuoteAction,
  parseQuickInputAction,
  updateQuoteAction,
} from "@/app/actions/quotes";
import {
  GLAZING_OPTIONS,
  INSTALL_SERVICES,
  PRODUCT_CATEGORIES,
  PROPERTY_TYPES,
} from "@/lib/brand";
import {
  calculateQuoteEstimate,
  type PricingSettingsInput,
} from "@/lib/pricing/calculateQuoteEstimate";
import type {
  QuoteFormValues,
  QuoteLineItemValues,
  QuickInputResult,
} from "@/lib/quotes/schemas";
import { formatCurrency } from "@/lib/utils";
import type { Quote } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceQuickInput } from "@/components/quotes/voice-quick-input";

function newLineItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultLineItem(): QuoteLineItemValues {
  return {
    id: newLineItemId(),
    category: "plastove_okna",
    widthMm: 1200,
    heightMm: 1400,
    count: 1,
    color: "",
    glazing: "trojsklo",
    notes: "",
  };
}

function emptyForm(): QuoteFormValues {
  return {
    customerFirstName: "",
    customerLastName: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    siteAddress: "",
    propertyType: null,
    floor: null,
    installDate: "",
    lineItems: [createDefaultLineItem()],
    montaz: true,
    demontazStarych: false,
    likvidacia: false,
    parapetVnutorny: false,
    parapetVonkajsi: false,
    sieteProtiHmyzu: false,
    otherService: false,
    internalNotes: "",
    customerNotes: "",
    saveAsDraft: false,
    priceIsManual: false,
    priceMin: null,
    priceMax: null,
  };
}

function quoteToForm(quote?: Quote | null): QuoteFormValues {
  if (!quote) return emptyForm();

  const lineItems =
    Array.isArray(quote.line_items) && quote.line_items.length > 0
      ? quote.line_items.map((item) => ({
          id: item.id || newLineItemId(),
          category: (item.category ||
            "plastove_okna") as QuoteLineItemValues["category"],
          widthMm: Number(item.widthMm) || 0,
          heightMm: Number(item.heightMm) || 0,
          count: Math.max(1, Number(item.count) || 1),
          color: item.color || "",
          glazing: (item.glazing ||
            null) as QuoteLineItemValues["glazing"],
          notes: item.notes || "",
        }))
      : [createDefaultLineItem()];

  return {
    customerFirstName: quote.customer_first_name || "",
    customerLastName: quote.customer_last_name || "",
    customerName: quote.customer_name || "",
    customerEmail: quote.customer_email || "",
    customerPhone: quote.customer_phone || "",
    siteAddress: quote.site_address || "",
    propertyType:
      (quote.property_type as QuoteFormValues["propertyType"]) || null,
    floor: quote.floor,
    installDate: quote.install_date || "",
    lineItems,
    montaz: Boolean(quote.montaz),
    demontazStarych: Boolean(quote.demontaz_starych),
    likvidacia: Boolean(quote.likvidacia),
    parapetVnutorny: Boolean(quote.parapet_vnutorny),
    parapetVonkajsi: Boolean(quote.parapet_vonkajsi),
    sieteProtiHmyzu: Boolean(quote.siete_proti_hmyzu),
    otherService: Boolean(quote.other_service),
    internalNotes: quote.internal_notes || "",
    customerNotes: quote.customer_notes || "",
    saveAsDraft: quote.status === "draft",
    priceIsManual: Boolean(quote.price_is_manual),
    priceMin: quote.price_min,
    priceMax: quote.price_max,
  };
}

const SERVICE_FIELD_MAP: Record<
  (typeof INSTALL_SERVICES)[number]["key"],
  keyof QuoteFormValues
> = {
  montaz: "montaz",
  demontazStarych: "demontazStarych",
  likvidacia: "likvidacia",
  parapetVnutorny: "parapetVnutorny",
  parapetVonkajsi: "parapetVonkajsi",
  sieteProtiHmyzu: "sieteProtiHmyzu",
  otherService: "otherService",
};

function applyQuickParse(
  prev: QuoteFormValues,
  d: QuickInputResult
): QuoteFormValues {
  const first =
    d.customerFirstName?.trim() ||
    (d.customerName ? d.customerName.trim().split(/\s+/)[0] : null);
  const last =
    d.customerLastName?.trim() ||
    (d.customerName
      ? d.customerName.trim().split(/\s+/).slice(1).join(" ")
      : null);
  const fullName =
    d.customerName?.trim() ||
    [first, last].filter(Boolean).join(" ").trim() ||
    prev.customerName;

  const next: QuoteFormValues = {
    ...prev,
    siteAddress: d.siteAddress ?? prev.siteAddress,
    propertyType:
      (d.propertyType as QuoteFormValues["propertyType"]) ?? prev.propertyType,
    floor: d.floor ?? prev.floor,
    installDate: d.installDate ?? prev.installDate,
    customerNotes: d.notes ?? prev.customerNotes,
    customerName: fullName || prev.customerName,
    customerFirstName: first || prev.customerFirstName,
    customerLastName: last || prev.customerLastName,
    customerPhone: d.customerPhone ?? prev.customerPhone,
    customerEmail: d.customerEmail ?? prev.customerEmail,
    montaz: d.montaz ?? prev.montaz,
    demontazStarych: d.demontazStarych ?? prev.demontazStarych,
    likvidacia: d.likvidacia ?? prev.likvidacia,
    parapetVnutorny: d.parapetVnutorny ?? prev.parapetVnutorny,
    parapetVonkajsi: d.parapetVonkajsi ?? prev.parapetVonkajsi,
    sieteProtiHmyzu: d.sieteProtiHmyzu ?? prev.sieteProtiHmyzu,
    otherService: d.otherService ?? prev.otherService,
  };

  const parsedItems =
    d.lineItems?.filter(
      (item) =>
        item &&
        (item.category != null ||
          (item.widthMm != null && item.heightMm != null) ||
          item.count != null)
    ) ?? [];

  const fallbackItem =
    d.category != null ||
    (d.widthMm != null && d.heightMm != null) ||
    d.count != null
      ? [
          {
            category: d.category,
            widthMm: d.widthMm,
            heightMm: d.heightMm,
            count: d.count,
            color: d.color,
            glazing: d.glazing,
            notes: null as string | null,
          },
        ]
      : [];

  const sourceItems = parsedItems.length > 0 ? parsedItems : fallbackItem;

  if (sourceItems.length > 0) {
    const mapped: QuoteLineItemValues[] = sourceItems.map((item) => ({
      id: newLineItemId(),
      category: (item.category ||
        "plastove_okna") as QuoteLineItemValues["category"],
      widthMm: item.widthMm ?? 1200,
      heightMm: item.heightMm ?? 1400,
      count: Math.max(1, item.count ?? 1),
      color: item.color || "",
      glazing: (item.glazing || null) as QuoteLineItemValues["glazing"],
      notes: item.notes || "",
    }));

    const isPlaceholder =
      prev.lineItems.length === 1 &&
      prev.lineItems[0].widthMm === 1200 &&
      prev.lineItems[0].heightMm === 1400 &&
      prev.lineItems[0].count === 1 &&
      !prev.lineItems[0].notes &&
      !prev.lineItems[0].color;

    next.lineItems = isPlaceholder ? mapped : [...prev.lineItems, ...mapped];
  }

  return next;
}

export function QuoteForm({
  pricing,
  quote,
  mode,
}: {
  pricing: PricingSettingsInput;
  quote?: Quote | null;
  mode: "create" | "edit";
}) {
  const [form, setForm] = useState<QuoteFormValues>(() => quoteToForm(quote));
  const [quickText, setQuickText] = useState("");
  const [pending, startTransition] = useTransition();
  const [parsing, setParsing] = useState(false);

  const estimate = useMemo(
    () =>
      calculateQuoteEstimate(
        {
          items: form.lineItems,
          montaz: form.montaz,
          demontazStarych: form.demontazStarych,
          likvidacia: form.likvidacia,
          parapetVnutorny: form.parapetVnutorny,
          parapetVonkajsi: form.parapetVonkajsi,
          sieteProtiHmyzu: form.sieteProtiHmyzu,
          otherService: form.otherService,
        },
        pricing
      ),
    [form, pricing]
  );

  async function recognizeFromText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Zadajte popis zákazky alebo nahrajte hlas.");
      return;
    }
    setParsing(true);
    try {
      const result = await parseQuickInputAction(trimmed);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setForm((prev) => applyQuickParse(prev, result.data!));
      toast.success("Údaje boli rozpoznané — skontrolujte formulár.");
    } finally {
      setParsing(false);
    }
  }

  function set<K extends keyof QuoteFormValues>(
    key: K,
    value: QuoteFormValues[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "customerFirstName" || key === "customerLastName") {
        next.customerName = [next.customerFirstName, next.customerLastName]
          .filter(Boolean)
          .join(" ")
          .trim();
      }
      return next;
    });
  }

  function updateLineItem(
    id: string,
    patch: Partial<QuoteLineItemValues>
  ) {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  }

  function addLineItem() {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, createDefaultLineItem()],
    }));
  }

  function removeLineItem(id: string) {
    setForm((prev) => ({
      ...prev,
      lineItems:
        prev.lineItems.length <= 1
          ? prev.lineItems
          : prev.lineItems.filter((item) => item.id !== id),
    }));
  }

  const showVersionWarning =
    mode === "edit" &&
    quote &&
    (quote.status === "sent" || quote.status === "opened");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        {showVersionWarning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Táto ponuka už bola odoslaná zákazníkovi. Pri uložení zmien vytvoríme
            novú verziu ponuky.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Rýchle zadanie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Napr. Rodinný dom Trenčín, 4× plastové okná 1200×1400 mm trojsklo, biela, demontáž starých + montáž. Termín 15.10. — alebo použite mikrofón."
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <VoiceQuickInput
                disabled={parsing}
                onTranscript={async (text) => {
                  setQuickText(text);
                  await recognizeFromText(text);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={parsing}
                onClick={() => recognizeFromText(quickText)}
              >
                {parsing ? "Rozpoznávam…" : "Rozpoznať údaje"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mikrofón prepíše reč (Whisper) a AI vyplní polia. Funguje aj na
              Vercel — potrebuje OPENAI_API_KEY v Environment Variables.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zákazník</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Meno zákazníka</Label>
              <Input
                value={form.customerFirstName || ""}
                onChange={(e) => set("customerFirstName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Priezvisko</Label>
              <Input
                value={form.customerLastName || ""}
                onChange={(e) => set("customerLastName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail (voliteľné)</Label>
              <Input
                type="email"
                value={form.customerEmail || ""}
                onChange={(e) => set("customerEmail", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefón (voliteľné)</Label>
              <Input
                value={form.customerPhone || ""}
                onChange={(e) => set("customerPhone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Miesto montáže</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Adresa montáže</Label>
              <Input
                placeholder="Ulica, mesto"
                value={form.siteAddress || ""}
                onChange={(e) => set("siteAddress", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Typ objektu</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                value={form.propertyType || ""}
                onChange={(e) =>
                  set(
                    "propertyType",
                    (e.target.value ||
                      null) as QuoteFormValues["propertyType"]
                  )
                }
              >
                <option value="">—</option>
                {PROPERTY_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Poschodie</Label>
              <Input
                type="number"
                value={form.floor ?? ""}
                onChange={(e) =>
                  set(
                    "floor",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Predpokladaný dátum montáže</Label>
              <Input
                type="date"
                value={form.installDate || ""}
                onChange={(e) => set("installDate", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Položky ponuky</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              Pridať položku
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.lineItems.map((item, index) => (
              <div
                key={item.id}
                className="space-y-4 rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Položka {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={form.lineItems.length <= 1}
                    onClick={() => removeLineItem(item.id)}
                  >
                    Odstrániť
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Kategória</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                      value={item.category}
                      onChange={(e) =>
                        updateLineItem(item.id, {
                          category:
                            e.target.value as QuoteLineItemValues["category"],
                        })
                      }
                    >
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Šírka (mm)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={item.widthMm || ""}
                      onChange={(e) =>
                        updateLineItem(item.id, {
                          widthMm:
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Výška (mm)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={item.heightMm || ""}
                      onChange={(e) =>
                        updateLineItem(item.id, {
                          heightMm:
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Počet ks</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.count || ""}
                      onChange={(e) =>
                        updateLineItem(item.id, {
                          count: Math.max(
                            1,
                            e.target.value === ""
                              ? 1
                              : Number(e.target.value)
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Farba</Label>
                    <Input
                      placeholder="napr. biela, antracit"
                      value={item.color || ""}
                      onChange={(e) =>
                        updateLineItem(item.id, { color: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Zasklenie</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                      value={item.glazing || ""}
                      onChange={(e) =>
                        updateLineItem(item.id, {
                          glazing: (e.target.value ||
                            null) as QuoteLineItemValues["glazing"],
                        })
                      }
                    >
                      <option value="">—</option>
                      {GLAZING_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Poznámka k položke</Label>
                    <Input
                      value={item.notes || ""}
                      onChange={(e) =>
                        updateLineItem(item.id, { notes: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doplnkové služby</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {INSTALL_SERVICES.map((service) => {
              const field = SERVICE_FIELD_MAP[service.key];
              return (
                <label
                  key={service.key}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <Checkbox
                    checked={Boolean(form[field])}
                    onCheckedChange={(checked) =>
                      set(field, Boolean(checked) as never)
                    }
                  />
                  <span className="text-sm">{service.label}</span>
                </label>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Poznámky</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Poznámka pre zákazníka</Label>
              <Textarea
                placeholder="Napr. termín montáže dohodneme po zameraní. Parkovanie pred domom."
                value={form.customerNotes || ""}
                onChange={(e) => set("customerNotes", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Interná poznámka</Label>
              <Textarea
                value={form.internalNotes || ""}
                onChange={(e) => set("internalNotes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const payload = { ...form, saveAsDraft: false };
                const result =
                  mode === "create"
                    ? await createQuoteAction(payload)
                    : await updateQuoteAction(quote!.id, payload);
                if (result?.error) toast.error(result.error);
              });
            }}
          >
            {pending
              ? "Ukladám…"
              : mode === "create"
                ? "Vytvoriť webovú ponuku"
                : "Uložiť zmeny"}
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const payload = { ...form, saveAsDraft: true };
                const result =
                  mode === "create"
                    ? await createQuoteAction(payload)
                    : await updateQuoteAction(quote!.id, payload);
                if (result?.error) toast.error(result.error);
              });
            }}
          >
            Uložiť ako koncept
          </Button>
        </div>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <Card className="border-[var(--brand-blue)]/20 shadow-md ring-1 ring-[var(--brand-blue)]/10">
          <CardHeader>
            <div
              className="mb-2 h-1 w-10 rounded-sm"
              style={{ backgroundColor: "var(--brand-green)" }}
            />
            <CardTitle>Živý odhad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produkty</span>
                <span>{formatCurrency(estimate.productsCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montáž</span>
                <span>{formatCurrency(estimate.montazCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doplnkové služby</span>
                <span>{formatCurrency(estimate.extrasCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fixný poplatok</span>
                <span>{formatCurrency(estimate.fixedFee)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {estimate.totalUnits} ks · {estimate.totalAreaM2} m²
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Výpočet systému</span>
                <span>
                  {formatCurrency(estimate.priceMin)} –{" "}
                  {formatCurrency(estimate.priceMax)}
                </span>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <Checkbox
                checked={Boolean(form.priceIsManual)}
                onCheckedChange={(checked) => {
                  const enabled = Boolean(checked);
                  setForm((prev) => ({
                    ...prev,
                    priceIsManual: enabled,
                    priceMin: enabled
                      ? prev.priceMin ?? estimate.priceMin
                      : prev.priceMin,
                    priceMax: enabled
                      ? prev.priceMax ?? estimate.priceMax
                      : prev.priceMax,
                  }));
                }}
              />
              <span className="text-sm">Upraviť cenu manuálne</span>
            </label>

            {form.priceIsManual ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Minimum (€)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={10}
                      value={form.priceMin ?? ""}
                      onChange={(e) =>
                        set(
                          "priceMin",
                          e.target.value === ""
                            ? null
                            : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Maximum (€)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={10}
                      value={form.priceMax ?? ""}
                      onChange={(e) =>
                        set(
                          "priceMax",
                          e.target.value === ""
                            ? null
                            : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      priceMin: estimate.priceMin,
                      priceMax: estimate.priceMax,
                    }))
                  }
                >
                  Nastaviť podľa výpočtu
                </Button>
              </div>
            ) : null}

            <div
              className="rounded-lg px-4 py-5 text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-blue-dark) 0%, var(--brand-blue) 70%, var(--brand-green) 160%)",
              }}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-blue-100/60">
                {form.priceIsManual
                  ? "Vami nastavený rozsah"
                  : "Orientačný cenový rozsah"}
              </p>
              <p className="mt-2 font-display text-3xl tracking-tight">
                {formatCurrency(
                  form.priceIsManual && form.priceMin != null
                    ? Number(form.priceMin)
                    : estimate.priceMin
                )}{" "}
                –{" "}
                {formatCurrency(
                  form.priceIsManual && form.priceMax != null
                    ? Number(form.priceMax)
                    : estimate.priceMax
                )}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {form.priceIsManual
                ? "Tento rozsah sa zobrazí zákazníkovi. Interný výpočet ostáva ako referencia."
                : "Rozpätie počíta s možným rozdielom po zameraní a finálnej špecifikácii."}
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
