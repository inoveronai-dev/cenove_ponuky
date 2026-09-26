"use client";

import { toast } from "sonner";
import { sendQuoteEmailAction } from "@/app/actions/quotes";
import { Button } from "@/components/ui/button";

export function SendQuoteEmailButton({
  quoteId,
  disabled,
}: {
  quoteId: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={disabled}
      onClick={async () => {
        const result = await sendQuoteEmailAction(quoteId);
        if (result?.error) toast.error(result.error);
        else toast.success("E-mail odoslaný zákazníkovi");
      }}
    >
      Odoslať e-mailom
    </Button>
  );
}
