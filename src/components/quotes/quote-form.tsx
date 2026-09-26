"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createQuoteAction,
  parseQuickInputAction,
  updateQuoteAction,
} from "@/app/actions/quotes";
import {
  ADDITIONAL_SERVICES,
  PROPERTY_TYPES,
  VEHICLE_TYPES,
} from "@/lib/brand";
import {
  calculateQuoteEstimate,
  type PricingSettingsInput,
} from "@/lib/pricing/calculateQuoteEstimate";
import type { QuoteFormValues } from "@/lib/quotes/schemas";
import { formatCurrency } from "@/lib/utils";
import type { Quote } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function quoteToForm(quote?: Quote | null): QuoteFormValues {
  if (!quote) {
    return {
      customerFirstName: "",
      customerLastName: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      originAddress: "",
      destinationAddress: "",
      originPropertyType: null,
      originFloor: null,
      originElevator: null,
      destinationFloor: null,
      destinationElevator: null,
      distanceKm: null,
      boxCount: null,
      largeItems: "",
      wardrobesCount: null,
      bedsCount: null,
      sofasCount: null,
      appliancesCount: null,
      disassembly: false,
      assembly: false,
      packing: false,
      packingMaterial: false,
      disposal: false,
      heavyItems: false,
      protectiveWrapping: false,
      otherService: false,
      moveDate: "",
      estimatedHours: 4,
      workers: 2,
      vehicleType: "",
      isWeekend: false,
      isEvening: false,
      internalNotes: "",
      customerNotes: "",
      saveAsDraft: false,
      priceIsManual: false,
      priceMin: null,
      priceMax: null,
    };
  }

  return {
    customerFirstName: quote.customer_first_name || "",
    customerLastName: quote.customer_last_name || "",
    customerName: quote.customer_name || "",
    customerEmail: quote.customer_email || "",
    customerPhone: quote.customer_phone || "",
    originAddress: quote.origin_address || "",
    destinationAddress: quote.destination_address || "",
    originPropertyType: quote.origin_property_type as QuoteFormValues["originPropertyType"],
    originFloor: quote.origin_floor,
    originElevator: quote.origin_elevator,
    destinationFloor: quote.destination_floor,
    destinationElevator: quote.destination_elevator,
    distanceKm: quote.distance_km,
    boxCount: quote.box_count,
    largeItems: quote.large_items || "",
    wardrobesCount: quote.wardrobes_count,
    bedsCount: quote.beds_count,
    sofasCount: quote.sofas_count,
    appliancesCount: quote.appliances_count,
    disassembly: quote.disassembly,
    assembly: quote.assembly,
    packing: quote.packing,
    packingMaterial: quote.packing_material,
    disposal: quote.disposal,
    heavyItems: quote.heavy_items,
    protectiveWrapping: quote.protective_wrapping,
    otherService: quote.other_service,
    moveDate: quote.move_date || "",
    estimatedHours: quote.estimated_hours,
    workers: quote.workers,
    vehicleType: quote.vehicle_type || "",
    isWeekend: quote.is_weekend,
    isEvening: quote.is_evening,
    internalNotes: quote.internal_notes || "",
    customerNotes: quote.customer_notes || "",
    saveAsDraft: quote.status === "draft",
    priceIsManual: Boolean(quote.price_is_manual),
    priceMin: quote.price_min,
    priceMax: quote.price_max,
  };
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
          estimatedHours: Number(form.estimatedHours) || 0,
          workers: Number(form.workers) || 0,
          distanceKm: Number(form.distanceKm) || 0,
          disassembly: form.disassembly,
          assembly: form.assembly,
          packing: form.packing,
          packingMaterial: form.packingMaterial,
          heavyItems: form.heavyItems,
          disposal: form.disposal,
          protectiveWrapping: form.protectiveWrapping,
          otherService: form.otherService,
          isWeekend: form.isWeekend,
          isEvening: form.isEvening,
        },
        pricing
      ),
    [form, pricing]
  );

  function set<K extends keyof QuoteFormValues>(key: K, value: QuoteFormValues[K]) {
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
              placeholder="Napr. 3 izbák Ružinov do Trnavy, 4. poschodie s výťahom, približne 35 krabíc, gauč, posteľ, práčka a dve skrine. Skrine treba rozobrať. Termín 28.9."
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={parsing}
              onClick={async () => {
                setParsing(true);
                const result = await parseQuickInputAction(quickText);
                setParsing(false);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                const d = result.data!;
                setForm((prev) => ({
                  ...prev,
                  originAddress: d.originAddress ?? prev.originAddress,
                  destinationAddress:
                    d.destinationAddress ?? prev.destinationAddress,
                  originPropertyType:
                    (d.propertyType as QuoteFormValues["originPropertyType"]) ??
                    prev.originPropertyType,
                  originFloor: d.floor ?? prev.originFloor,
                  originElevator: d.elevator ?? prev.originElevator,
                  boxCount: d.boxCount ?? prev.boxCount,
                  largeItems: d.largeItems ?? prev.largeItems,
                  disassembly: d.disassembly ?? prev.disassembly,
                  assembly: d.assembly ?? prev.assembly,
                  packing: d.packing ?? prev.packing,
                  moveDate: d.moveDate ?? prev.moveDate,
                  customerNotes: d.notes ?? prev.customerNotes,
                  estimatedHours: d.estimatedHours ?? prev.estimatedHours,
                  workers: d.workers ?? prev.workers,
                  distanceKm: d.distanceKm ?? prev.distanceKm,
                  customerName: d.customerName ?? prev.customerName,
                }));
                toast.success("Údaje boli rozpoznané — skontrolujte formulár.");
              }}
            >
              {parsing ? "Rozpoznávam…" : "Rozpoznať údaje"}
            </Button>
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
            <CardTitle>Trasa sťahovania</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-1">
              <Label>Odkiaľ</Label>
              <Input
                value={form.originAddress || ""}
                onChange={(e) => set("originAddress", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kam</Label>
              <Input
                value={form.destinationAddress || ""}
                onChange={(e) => set("destinationAddress", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Typ priestoru (odkiaľ)</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                value={form.originPropertyType || ""}
                onChange={(e) =>
                  set(
                    "originPropertyType",
                    (e.target.value || null) as QuoteFormValues["originPropertyType"]
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
              <Label>Poschodie (odkiaľ)</Label>
              <Input
                type="number"
                value={form.originFloor ?? ""}
                onChange={(e) =>
                  set(
                    "originFloor",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Výťah (odkiaľ)</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                value={
                  form.originElevator == null
                    ? ""
                    : form.originElevator
                      ? "yes"
                      : "no"
                }
                onChange={(e) =>
                  set(
                    "originElevator",
                    e.target.value === ""
                      ? null
                      : e.target.value === "yes"
                  )
                }
              >
                <option value="">—</option>
                <option value="yes">Áno</option>
                <option value="no">Nie</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Poschodie (kam)</Label>
              <Input
                type="number"
                value={form.destinationFloor ?? ""}
                onChange={(e) =>
                  set(
                    "destinationFloor",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Výťah (kam)</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                value={
                  form.destinationElevator == null
                    ? ""
                    : form.destinationElevator
                      ? "yes"
                      : "no"
                }
                onChange={(e) =>
                  set(
                    "destinationElevator",
                    e.target.value === ""
                      ? null
                      : e.target.value === "yes"
                  )
                }
              >
                <option value="">—</option>
                <option value="yes">Áno</option>
                <option value="no">Nie</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Vzdialenosť (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.distanceKm ?? ""}
                onChange={(e) =>
                  set(
                    "distanceKm",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Pripravené na neskoršie automatické počítanie cez mapy.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Čo sťahujeme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Približný počet krabíc</Label>
                <Input
                  type="number"
                  value={form.boxCount ?? ""}
                  onChange={(e) =>
                    set(
                      "boxCount",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Veľký nábytok / položky</Label>
              <Textarea
                placeholder="sedačka, posteľ, práčka, chladnička, 2 skrine"
                value={form.largeItems || ""}
                onChange={(e) => set("largeItems", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              {(
                [
                  ["wardrobesCount", "Skrine"],
                  ["bedsCount", "Postele"],
                  ["sofasCount", "Sedačky"],
                  ["appliancesCount", "Spotrebiče"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    value={form[key] ?? ""}
                    onChange={(e) =>
                      set(
                        key,
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ADDITIONAL_SERVICES.map((service) => {
                const keyMap: Record<string, keyof QuoteFormValues> = {
                  disassembly: "disassembly",
                  assembly: "assembly",
                  packing: "packing",
                  packing_material: "packingMaterial",
                  disposal: "disposal",
                  heavy_items: "heavyItems",
                  protective_wrapping: "protectiveWrapping",
                  other: "otherService",
                };
                const field = keyMap[service.key];
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
            </div>
            <div className="space-y-2">
              <Label>Poznámka k zákazke</Label>
              <Textarea
                placeholder="Klient preferuje ranný začiatok. Parkovanie je približne 20 metrov od vchodu."
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

        <Card>
          <CardHeader>
            <CardTitle>Termín a parametre</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Predpokladaný dátum sťahovania</Label>
              <Input
                type="date"
                value={form.moveDate || ""}
                onChange={(e) => set("moveDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Odhadovaný čas (hodiny)</Label>
              <Input
                type="number"
                step="0.5"
                value={form.estimatedHours ?? ""}
                onChange={(e) =>
                  set(
                    "estimatedHours",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Počet pracovníkov</Label>
              <Input
                type="number"
                value={form.workers ?? ""}
                onChange={(e) =>
                  set(
                    "workers",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Typ vozidla</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                value={form.vehicleType || ""}
                onChange={(e) => set("vehicleType", e.target.value)}
              >
                <option value="">—</option>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <Checkbox
                checked={form.isWeekend}
                onCheckedChange={(c) => set("isWeekend", Boolean(c))}
              />
              <span className="text-sm">Víkendový príplatok</span>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <Checkbox
                checked={form.isEvening}
                onCheckedChange={(c) => set("isEvening", Boolean(c))}
              />
              <span className="text-sm">Večerný príplatok</span>
            </label>
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
                <span className="text-muted-foreground">Práca</span>
                <span>{formatCurrency(estimate.laborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doprava</span>
                <span>{formatCurrency(estimate.transportCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doplnkové služby</span>
                <span>{formatCurrency(estimate.extrasCost)}</span>
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
                : "Rozpätie počíta s možným rozdielom medzi odhadovaným a skutočným rozsahom sťahovania."}
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
