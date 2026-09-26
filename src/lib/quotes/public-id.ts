import { customAlphabet } from "nanoid";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generate = customAlphabet(alphabet, 6);

export function generatePublicId(): string {
  return generate();
}

export function publicQuotePath(publicId: string): string {
  return `/ponuka/${publicId}`;
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
