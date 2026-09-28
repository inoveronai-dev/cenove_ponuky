import { promises as fs } from "fs";
import path from "path";
import { deflateSync, inflateSync } from "zlib";
import { cookies } from "next/headers";
import type { Company, Quote } from "@/types/database";

export type PublicQuoteBundle = {
  quote: Quote;
  company: Pick<
    Company,
    | "id"
    | "name"
    | "subtitle"
    | "address"
    | "ico"
    | "dic"
    | "ic_dph"
    | "email"
    | "phone"
    | "website"
    | "logo_url"
    | "primary_color"
  >;
};

const COOKIE_PREFIX = "mq_pq_";
const COOKIE_MAX = 3500;

function snapshotDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "movequote-public-quotes");
  }
  return path.join(process.cwd(), ".data", "public-quotes");
}

function snapshotPath(publicId: string) {
  const safe = publicId.replace(/[^A-Za-z0-9_-]/g, "");
  return path.join(snapshotDir(), `${safe}.json`);
}

function cookieName(publicId: string) {
  return `${COOKIE_PREFIX}${publicId.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24)}`;
}

/** Compact bundle for cookie / URL — drop internal-only fields */
export function slimPublicBundle(bundle: PublicQuoteBundle): PublicQuoteBundle {
  const q = bundle.quote;
  return {
    company: {
      id: bundle.company.id,
      name: bundle.company.name,
      subtitle: bundle.company.subtitle,
      address: bundle.company.address,
      ico: bundle.company.ico,
      dic: bundle.company.dic,
      ic_dph: bundle.company.ic_dph,
      email: bundle.company.email,
      phone: bundle.company.phone,
      website: bundle.company.website,
      logo_url: bundle.company.logo_url,
      primary_color: bundle.company.primary_color,
    },
    quote: {
      ...q,
      internal_notes: null,
      customer_email: q.customer_email,
      ai_intro: truncate(q.ai_intro, 900),
      ai_summary: truncate(q.ai_summary, 700),
      ai_scope_note: truncate(q.ai_scope_note, 500),
      products_amount: q.products_amount,
      montaz_amount: q.montaz_amount,
      extras_amount: q.extras_amount,
      base_estimate: q.base_estimate,
    },
  };
}

function truncate(s: string | null, max: number): string | null {
  if (!s) return null;
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export function encodePublicSnapshot(bundle: PublicQuoteBundle): string {
  const slim = slimPublicBundle(bundle);
  return deflateSync(Buffer.from(JSON.stringify(slim), "utf8")).toString(
    "base64url"
  );
}

export function decodePublicSnapshot(raw: string): PublicQuoteBundle | null {
  try {
    const json = inflateSync(Buffer.from(raw, "base64url")).toString("utf8");
    const parsed = JSON.parse(json) as PublicQuoteBundle;
    if (!parsed?.quote?.public_id || !parsed?.company?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function persistPublicSnapshot(
  bundle: PublicQuoteBundle
): Promise<void> {
  const slim = slimPublicBundle(bundle);
  const publicId = slim.quote.public_id;

  try {
    const dir = snapshotDir();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      snapshotPath(publicId),
      JSON.stringify(slim),
      "utf8"
    );
  } catch (err) {
    console.error("Public quote file write failed:", err);
  }

  try {
    let packed = encodePublicSnapshot(slim);
    if (packed.length > COOKIE_MAX) {
      const tighter: PublicQuoteBundle = {
        ...slim,
        quote: {
          ...slim.quote,
          ai_intro: truncate(slim.quote.ai_intro, 280),
          ai_summary: truncate(slim.quote.ai_summary, 220),
          ai_scope_note: truncate(slim.quote.ai_scope_note, 160),
          customer_notes: truncate(slim.quote.customer_notes, 120),
        },
      };
      packed = encodePublicSnapshot(tighter);
    }
    if (packed.length > COOKIE_MAX) return;
    const jar = await cookies();
    jar.set(cookieName(publicId), packed, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.VERCEL === "1",
      maxAge: 60 * 60 * 24 * 60,
    });
  } catch (err) {
    console.error("Public quote cookie write failed:", err);
  }
}

export async function loadPublicSnapshot(
  publicId: string
): Promise<PublicQuoteBundle | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(cookieName(publicId))?.value;
    if (raw) {
      const fromCookie = decodePublicSnapshot(raw);
      if (fromCookie && fromCookie.quote.public_id === publicId) {
        return fromCookie;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = await fs.readFile(snapshotPath(publicId), "utf8");
    const parsed = JSON.parse(raw) as PublicQuoteBundle;
    if (parsed?.quote?.public_id === publicId) return parsed;
  } catch {
    /* ignore */
  }

  return null;
}

/** Build relative share path that embeds the quote so /ponuka works without demo store */
export function publicQuoteSharePath(bundle: PublicQuoteBundle): string {
  const encoded = encodePublicSnapshot(bundle);
  const base = `/ponuka/${bundle.quote.public_id}`;
  // Keep URLs usable; if too large, fall back to bare path (cookie/file may still work)
  if (encoded.length > 5500) return base;
  return `${base}?d=${encoded}`;
}
