"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePricingSettingsAction } from "@/app/actions/settings";
import type { PricingSettings } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FIELDS: { key: keyof PricingSettings; label: string; hint?: string }[] = [
  { key: "hourly_rate_per_worker", label: "Cena za pracovníka / hodinu (€)" },
  { key: "kilometer_rate", label: "Cena za kilometer (€)" },
  { key: "route_multiplier", label: "Násobiteľ trasy", hint: "Pre budúce mapové výpočty" },
  { key: "fixed_fee", label: "Základný / fixný poplatok (€)" },
  { key: "disassembly_surcharge", label: "Demontáž (€)" },
  { key: "assembly_surcharge", label: "Montáž (€)" },
  { key: "packing_surcharge", label: "Balenie (€)" },
  { key: "packing_material_surcharge", label: "Baliaci materiál (€)" },
  { key: "heavy_items_surcharge", label: "Ťažké predmety (€)" },
  { key: "disposal_surcharge", label: "Odvoz nepotrebného (€)" },
  { key: "protective_wrapping_surcharge", label: "Ochranné balenie (€)" },
  { key: "other_surcharge", label: "Iné (€)" },
  { key: "minimum_job_price", label: "Minimálna cena zákazky (€)" },
  { key: "weekend_surcharge_percent", label: "Víkendový príplatok (%)" },
  { key: "evening_surcharge_percent", label: "Večerný príplatok (%)" },
  {
    key: "buffer_min_multiplier",
    label: "Buffer minimum (násobiteľ)",
    hint: "Napr. 0.92 = −8 %",
  },
  {
    key: "buffer_max_multiplier",
    label: "Buffer maximum (násobiteľ)",
    hint: "Napr. 1.12 = +12 %",
  },
];

export function PricingForm({ pricing }: { pricing: PricingSettings }) {
  const [form, setForm] = useState(() => {
    const initial: Record<string, number> = {};
    for (const field of FIELDS) {
      initial[field.key] = Number(pricing[field.key]);
    }
    return initial;
  });
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cenník</CardTitle>
        <CardDescription>
          Deterministický výpočet ceny. AI tieto hodnoty nikdy nevymýšľa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Input
                type="number"
                step="0.01"
                value={form[field.key]}
                onChange={(e) =>
                  setForm({ ...form, [field.key]: Number(e.target.value) })
                }
              />
              {field.hint && (
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              )}
            </div>
          ))}
        </div>
        <Button
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await updatePricingSettingsAction(form);
              if (result.error) toast.error(result.error);
              else toast.success("Cenník uložený");
            });
          }}
        >
          {pending ? "Ukladám…" : "Uložiť cenník"}
        </Button>
      </CardContent>
    </Card>
  );
}
