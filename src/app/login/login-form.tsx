"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { enterDemoMode, signIn } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand/brand-logo";
import { CLIENT_BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm({ demoAvailable }: { demoAvailable: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="brand-surface flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="space-y-4">
          <BrandLogo height={36} />
          <div>
            <CardTitle>Prihlásenie</CardTitle>
            <CardDescription className="mt-1.5">
              {demoAvailable
                ? `Demo pre ${CLIENT_BRAND.legalName} — spustite lokálne bez Supabase.`
                : "Vstup do firemného dashboardu cenových ponúk."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {demoAvailable && (
            <form
              action={() => {
                startTransition(async () => {
                  await enterDemoMode();
                });
              }}
            >
              <Button className="w-full" type="submit" disabled={pending}>
                {pending ? "Spúšťam demo…" : "Vyskúšať demo bez Supabase"}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Predvyplnená firma {CLIENT_BRAND.legalName} + ponuka Ján Novák
              </p>
            </form>
          )}

          {!demoAvailable && (
            <form
              className="space-y-4"
              action={(formData) => {
                setError(null);
                startTransition(async () => {
                  const result = await signIn(formData);
                  if (result?.error) setError(result.error);
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" disabled={pending}>
                {pending ? "Prihlasujem…" : "Prihlásiť sa"}
              </Button>
            </form>
          )}

          {demoAvailable && (
            <form
              className="space-y-4"
              action={(formData) => {
                setError(null);
                startTransition(async () => {
                  const result = await signIn(formData);
                  if (result?.error) setError(result.error);
                });
              }}
            >
              <p className="text-center text-xs text-muted-foreground">
                V demo režime funguje aj ľubovoľný e-mail/heslo — rovnaké demo
                dáta.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input id="password" name="password" type="password" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" variant="outline" disabled={pending}>
                {pending ? "Prihlasujem…" : "Prihlásiť sa do dema"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Nemáte účet?{" "}
            <Link href="/register" className="text-primary underline">
              Registrovať sa
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
