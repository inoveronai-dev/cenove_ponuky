"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signUp } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand/brand-logo";
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

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="brand-surface flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="space-y-4">
          <BrandLogo height={36} />
          <div>
            <CardTitle>Vytvorenie účtu</CardTitle>
            <CardDescription className="mt-1.5">
              Založíme vám firmu, predvolený cenník a prázdny prehľad ponúk.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                const result = await signUp(formData);
                if (result?.error) setError(result.error);
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="fullName">Meno</Label>
              <Input id="fullName" name="fullName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={pending}>
              {pending ? "Vytváram…" : "Registrovať sa"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Už máte účet?{" "}
            <Link href="/login" className="text-foreground underline">
              Prihlásiť sa
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
