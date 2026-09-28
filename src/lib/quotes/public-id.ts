import { customAlphabet } from "nanoid";
import { isDemoMode } from "@/lib/demo/mode";
import { publicQuoteSharePath } from "@/lib/demo/public-snapshot";
import type { Company, Quote } from "@/types/database";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generate = customAlphabet(alphabet, 6);

export function generatePublicId(): string {
  return generate();
}

export function publicQuotePath(publicId: string): string {
  return `/ponuka/${publicId}`;
}

/** Path for opening/sharing — embeds demo snapshot so Vercel public pages work */
export function quoteSharePath(quote: Quote, company: Company): string {
  if (!isDemoMode()) return publicQuotePath(quote.public_id);
  return publicQuoteSharePath({ quote, company });
}

/** Absolute public quote URL — prefers live host on Vercel / browser. */
export function publicQuoteUrl(publicId: string, baseUrl?: string): string {
  const base = (
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
  return `${base}${publicQuotePath(publicId)}`;
}

export function quoteShareUrl(
  quote: Quote,
  company: Company,
  baseUrl?: string
): string {
  const base = (
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
  return `${base}${quoteSharePath(quote, company)}`;
}
