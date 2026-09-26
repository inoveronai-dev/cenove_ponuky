import Link from "next/link";
import { isDemoMode } from "@/lib/demo/mode";
import { RegisterForm } from "@/app/register/register-form";
import { EnterDemoButton } from "@/components/demo/enter-demo-button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { CLIENT_BRAND } from "@/lib/brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  if (isDemoMode()) {
    return (
      <div className="brand-surface flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md border-border shadow-sm">
          <CardHeader className="space-y-4">
            <BrandLogo height={36} />
            <div>
              <CardTitle>Demo režim</CardTitle>
              <CardDescription className="mt-1.5">
                Supabase nie je nastavený. Spustite lokálne demo pre{" "}
                {CLIENT_BRAND.legalName} — firma a vzorová ponuka sú pripravené.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <EnterDemoButton />
            <p className="text-center text-sm text-muted-foreground">
              Alebo{" "}
              <Link href="/login" className="text-primary underline">
                späť na prihlásenie
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <RegisterForm />;
}
