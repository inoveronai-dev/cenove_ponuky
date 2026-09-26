"use client";

import { useTransition } from "react";
import { enterDemoMode } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function EnterDemoButton({
  size = "default",
}: {
  size?: "default" | "lg" | "sm";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size={size}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await enterDemoMode();
        });
      }}
    >
      {pending ? "Spúšťam…" : "Vyskúšať demo"}
    </Button>
  );
}
