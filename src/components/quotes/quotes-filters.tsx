"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUSES = [
  { value: "all", label: "Všetky" },
  { value: "draft", label: "Koncept" },
  { value: "ready", label: "Pripravená" },
  { value: "sent", label: "Odoslaná" },
  { value: "opened", label: "Otvorená" },
];

export function QuotesFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") || "";
  const status = params.get("status") || "all";

  function update(next: { q?: string; status?: string }) {
    const sp = new URLSearchParams(params.toString());
    if (next.q !== undefined) {
      if (next.q) sp.set("q", next.q);
      else sp.delete("q");
    }
    if (next.status !== undefined) {
      if (next.status === "all") sp.delete("status");
      else sp.set("status", next.status);
    }
    router.push(`/dashboard/quotes?${sp.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Hľadať klienta, odkiaľ, kam…"
        defaultValue={q}
        className="max-w-md"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            update({ q: (e.target as HTMLInputElement).value });
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s.value}
            type="button"
            size="sm"
            variant={status === s.value ? "default" : "outline"}
            onClick={() => update({ status: s.value })}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
