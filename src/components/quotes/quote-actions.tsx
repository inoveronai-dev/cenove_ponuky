"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  archiveQuoteAction,
  duplicateQuoteAction,
  markQuoteSentAction,
} from "@/app/actions/quotes";
import { publicQuotePath } from "@/lib/quotes/public-id";
import { Button } from "@/components/ui/button";
import type { Quote } from "@/types/database";

export function QuoteActions({
  quote,
  compact = false,
}: {
  quote: Quote;
  compact?: boolean;
}) {
  const router = useRouter();
  const size = compact ? "sm" : "default";
  const path = publicQuotePath(quote.public_id);

  async function copyLink() {
    const absolute =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;
    await navigator.clipboard.writeText(absolute);
    await markQuoteSentAction(quote.id);
    toast.success("Link skopírovaný");
    router.refresh();
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-4"}`}>
      <Button asChild variant="outline" size={size}>
        <Link href={`/dashboard/quotes/${quote.id}`}>Zobraziť</Link>
      </Button>
      <Button asChild variant="outline" size={size}>
        <Link href={`/dashboard/quotes/${quote.id}/edit`}>Upraviť</Link>
      </Button>
      <Button type="button" variant="outline" size={size} onClick={copyLink}>
        Kopírovať link
      </Button>
      {!compact && (
        <>
          <Button asChild variant="outline" size={size}>
            <Link href={path} target="_blank">
              Zobraziť ako zákazník
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size={size}
            onClick={async () => {
              const result = await duplicateQuoteAction(quote.id);
              if (result?.error) toast.error(result.error);
            }}
          >
            Duplikovať
          </Button>
          <Button
            type="button"
            variant="outline"
            size={size}
            onClick={async () => {
              const result = await archiveQuoteAction(quote.id);
              if (result?.error) toast.error(result.error);
              else toast.success("Ponuka archivovaná");
            }}
          >
            Archivovať
          </Button>
        </>
      )}
    </div>
  );
}
