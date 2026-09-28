import { isDemoMode } from "@/lib/demo/mode";
import {
  decodePublicSnapshot,
  loadPublicSnapshot,
} from "@/lib/demo/public-snapshot";
import { readDemoStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import type { Quote, QuoteView } from "@/types/database";

export async function getQuoteById(
  quoteId: string,
  companyId: string
): Promise<Quote | null> {
  if (isDemoMode()) {
    const store = await readDemoStore();
    return (
      store.quotes.find(
        (q) => q.id === quoteId && q.company_id === companyId
      ) || null
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("company_id", companyId)
    .maybeSingle();

  return (data as Quote) || null;
}

export async function getQuoteViews(quoteId: string): Promise<QuoteView[]> {
  if (isDemoMode()) {
    const store = await readDemoStore();
    return store.quote_views
      .filter((v) => v.quote_id === quoteId)
      .sort(
        (a, b) =>
          new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime()
      );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("quote_views")
    .select("*")
    .eq("quote_id", quoteId)
    .order("viewed_at", { ascending: true });

  return (data as QuoteView[]) || [];
}

export async function getPublicQuoteByPublicId(
  publicId: string,
  encodedSnapshot?: string | null
) {
  if (isDemoMode()) {
    const store = await readDemoStore();
    const quote = store.quotes.find(
      (q) => q.public_id === publicId && !q.archived_at
    );
    if (quote) return { quote, company: store.company };

    const fromFileOrCookie = await loadPublicSnapshot(publicId);
    if (fromFileOrCookie && !fromFileOrCookie.quote.archived_at) {
      return fromFileOrCookie;
    }

    if (encodedSnapshot) {
      const decoded = decodePublicSnapshot(encodedSnapshot);
      if (
        decoded &&
        decoded.quote.public_id === publicId &&
        !decoded.quote.archived_at
      ) {
        return decoded;
      }
    }

    return null;
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data: quote } = await admin
    .from("quotes")
    .select("*")
    .eq("public_id", publicId)
    .is("archived_at", null)
    .maybeSingle();

  if (!quote) return null;

  const { data: company } = await admin
    .from("companies")
    .select(
      "name, subtitle, address, ico, dic, ic_dph, email, phone, website, logo_url, primary_color"
    )
    .eq("id", quote.company_id)
    .single();

  if (!company) return null;
  return { quote: quote as Quote, company };
}
