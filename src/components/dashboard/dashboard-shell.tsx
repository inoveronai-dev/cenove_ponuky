"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Tags,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { CLIENT_BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import type { Company, Notification } from "@/types/database";

const NAV = [
  { href: "/dashboard", label: "Prehľad", icon: LayoutDashboard },
  { href: "/dashboard/quotes", label: "Cenové ponuky", icon: FileText },
  { href: "/dashboard/quotes/new", label: "Nová ponuka", icon: PlusCircle },
  { href: "/dashboard/pricing", label: "Cenník", icon: Tags },
  { href: "/dashboard/settings", label: "Nastavenia", icon: Settings },
];

export function DashboardShell({
  company,
  profileName,
  email,
  notifications,
  isDemo = false,
  children,
}: {
  company: Company;
  profileName: string | null;
  email: string | null;
  notifications: Notification[];
  isDemo?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href ||
              (item.href !== "/dashboard/quotes/new" &&
                pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-muted text-white"
                : "text-blue-100/70 hover:bg-sidebar-muted/70 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="brand-surface flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="space-y-3 px-5 py-6">
          <div className="rounded-md bg-white px-2 py-2">
            <BrandLogo height={32} />
          </div>
          <p className="text-[11px] leading-snug text-blue-100/60">
            Cenové ponuky · {CLIENT_BRAND.name}
          </p>
          {isDemo && (
            <p className="inline-flex rounded-md bg-brand-green/20 px-2 py-1 text-[11px] font-medium text-emerald-200">
              Demo režim · bez Supabase
            </p>
          )}
        </div>
        {nav}
        <div className="mt-auto border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-white">
            {company.name}
          </p>
          <p className="truncate text-xs text-blue-100/55">
            {profileName || email}
          </p>
          <form action={signOut} className="mt-3">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 px-0 text-blue-100/60 hover:bg-transparent hover:text-white"
            >
              Odhlásiť sa
            </Button>
          </form>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex items-center justify-between gap-3 px-5 py-5">
              <div className="rounded-md bg-white px-2 py-1.5">
                <BrandLogo height={28} />
              </div>
              <button onClick={() => setOpen(false)} aria-label="Zavrieť">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <button
            className="rounded-md border border-border bg-card p-2 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ backgroundColor: CLIENT_BRAND.accent }}
            />
            {company.name}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell initial={notifications} />
            <Button asChild size="sm">
              <Link href="/dashboard/quotes/new">Nová ponuka</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
