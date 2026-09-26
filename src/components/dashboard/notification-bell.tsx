"use client";

import { Bell } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { markNotificationsReadAction } from "@/app/actions/settings";
import { formatDateTimeSk } from "@/lib/utils";
import type { Notification } from "@/types/database";
import { Button } from "@/components/ui/button";

export function NotificationBell({
  initial,
}: {
  initial: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  // Demo mode: refresh via soft navigation is enough; avoid browser Supabase client.
  useEffect(() => {
    const hasSupabase =
      typeof process !== "undefined" &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

    if (!hasSupabase) return;

    const interval = setInterval(async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);
        if (data) setItems(data as Notification[]);
      } catch {
        // ignore polling errors
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread > 0) {
            startTransition(async () => {
              await markNotificationsReadAction();
              setItems((prev) =>
                prev.map((n) => ({
                  ...n,
                  read_at: n.read_at || new Date().toISOString(),
                }))
              );
            });
          }
        }}
        aria-label="Notifikácie"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
            {unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-card p-2 shadow-lg">
          <div className="px-2 py-2 text-sm font-medium">
            Notifikácie {pending ? "…" : ""}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">
                Zatiaľ žiadne notifikácie.
              </p>
            ) : (
              items.map((n) => (
                <div key={n.id} className="rounded-lg px-2 py-2 hover:bg-muted">
                  {n.quote_id ? (
                    <Link
                      href={`/dashboard/quotes/${n.quote_id}`}
                      className="block"
                      onClick={() => setOpen(false)}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTimeSk(n.created_at)}
                      </p>
                    </Link>
                  ) : (
                    <>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTimeSk(n.created_at)}
                      </p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
