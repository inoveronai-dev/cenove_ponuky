"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { seedDemoCompanyAction } from "@/app/actions/quotes";
import {
  resetDemoDataAction,
  updateCompanySettingsAction,
  uploadLogoAction,
} from "@/app/actions/settings";
import type { Company } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsForm({ company }: { company: Company }) {
  const [form, setForm] = useState({
    name: company.name,
    subtitle: company.subtitle || "",
    address: company.address || "",
    ico: company.ico || "",
    dic: company.dic || "",
    ic_dph: company.ic_dph || "",
    email: company.email || "",
    phone: company.phone || "",
    website: company.website || "",
    primary_color: company.primary_color || "#2E5894",
    quote_validity_days: company.quote_validity_days,
    notify_on_first_open: company.notify_on_first_open,
    notify_on_later_open: company.notify_on_later_open,
    notification_cooldown_hours: company.notification_cooldown_hours,
    notification_email: company.notification_email || "",
  });
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Firemný profil</CardTitle>
          <CardDescription>
            Tieto údaje sa zobrazia v pätičke verejnej ponuky. Údaje môžete kedykoľvek zmeniť.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["name", "Názov firmy"],
              ["subtitle", "Podnadpis"],
              ["address", "Adresa"],
              ["ico", "IČO"],
              ["dic", "DIČ"],
              ["ic_dph", "IČ DPH"],
              ["email", "E-mail"],
              ["phone", "Telefón"],
              ["website", "Web"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primárna farba</Label>
            <Input
              type="color"
              value={form.primary_color}
              onChange={(e) =>
                setForm({ ...form, primary_color: e.target.value })
              }
              className="h-12 w-24 p-1"
            />
          </div>
          {company.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo_url}
              alt="Logo"
              className="h-16 w-auto rounded border border-border bg-white object-contain p-2"
            />
          )}
          <form
            className="flex flex-wrap items-end gap-3"
            action={async (fd) => {
              const result = await uploadLogoAction(fd);
              if (result.error) toast.error(result.error);
              else toast.success("Logo nahrané");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="logo">Nahrať logo</Label>
              <Input id="logo" name="logo" type="file" accept="image/*" />
            </div>
            <Button type="submit" variant="outline">
              Nahrať
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nastavenia ponúk</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Platnosť ponuky (dni)</Label>
            <Input
              type="number"
              value={form.quote_validity_days}
              onChange={(e) =>
                setForm({
                  ...form,
                  quote_validity_days: Number(e.target.value),
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifikácie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Upozorniť pri prvom otvorení</p>
            </div>
            <Switch
              checked={form.notify_on_first_open}
              onCheckedChange={(v) =>
                setForm({ ...form, notify_on_first_open: v })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Upozorniť pri neskorších otvoreniach</p>
            </div>
            <Switch
              checked={form.notify_on_later_open}
              onCheckedChange={(v) =>
                setForm({ ...form, notify_on_later_open: v })
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cooldown (hodiny)</Label>
              <Input
                type="number"
                value={form.notification_cooldown_hours}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notification_cooldown_hours: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail pre notifikácie</Label>
              <Input
                value={form.notification_email}
                onChange={(e) =>
                  setForm({ ...form, notification_email: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await updateCompanySettingsAction(form);
              if (result.error) toast.error(result.error);
              else toast.success("Nastavenia uložené");
            });
          }}
        >
          {pending ? "Ukladám…" : "Uložiť nastavenia"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const result = await seedDemoCompanyAction();
            if (result.error) toast.error(result.error);
            else toast.success("Demo firma TOP okno TN a ponuka Ján Novák pripravené");
          }}
        >
          Načítať demo údaje
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={async () => {
            const result = await resetDemoDataAction();
            if (result.error) toast.error(result.error);
            else toast.success("Demo dáta obnovené");
          }}
        >
          Obnoviť demo od nuly
        </Button>
      </div>
    </div>
  );
}
