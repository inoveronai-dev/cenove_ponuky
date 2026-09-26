import { createHash } from "crypto";
import { isDemoMode } from "@/lib/demo/mode";
import { newDemoId, updateDemoStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { maybeNotifyQuoteOpened } from "@/lib/notifications/sendOpenNotification";

export type RecordViewInput = {
  publicId: string;
  sessionId?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  ip?: string | null;
};

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || "movequote-view-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function recordQuoteView(input: RecordViewInput) {
  if (isDemoMode()) {
    let isFirstView = false;
    let notifyPayload: Parameters<typeof maybeNotifyQuoteOpened>[0] | null =
      null;

    await updateDemoStore((store) => {
      const quote = store.quotes.find(
        (q) => q.public_id === input.publicId && !q.archived_at
      );
      if (!quote) return;

      const now = new Date().toISOString();
      isFirstView = !quote.first_viewed_at;

      store.quote_views.push({
        id: newDemoId("view"),
        quote_id: quote.id,
        viewed_at: now,
        session_id: input.sessionId || null,
        user_agent: input.userAgent || null,
        referrer: input.referrer || null,
        ip_hash: hashIp(input.ip),
      });

      let uniqueSessionCount = quote.unique_session_count || 0;
      if (input.sessionId) {
        const sameSession = store.quote_views.filter(
          (v) =>
            v.quote_id === quote.id && v.session_id === input.sessionId
        ).length;
        if (sameSession <= 1) uniqueSessionCount += 1;
      }

      quote.view_count = (quote.view_count || 0) + 1;
      quote.last_viewed_at = now;
      quote.unique_session_count = uniqueSessionCount;
      if (isFirstView) quote.first_viewed_at = now;
      if (quote.status === "sent" || quote.status === "ready" || isFirstView) {
        quote.status = "opened";
      }
      quote.updated_at = now;

      notifyPayload = {
        quote: {
          id: quote.id,
          company_id: quote.company_id,
          created_by: quote.created_by,
          customer_name: quote.customer_name,
          site_address: quote.site_address,
          price_min: quote.price_min,
          price_max: quote.price_max,
          last_notified_at: quote.last_notified_at,
        },
        isFirstView,
      };
    });

    if (!notifyPayload) return { ok: false as const, error: "not_found" };
    await maybeNotifyQuoteOpened(notifyPayload);
    return { ok: true as const, isFirstView };
  }

  const admin = createAdminClient();

  const { data: quote, error } = await admin
    .from("quotes")
    .select(
      "id, company_id, created_by, status, customer_name, site_address, price_min, price_max, first_viewed_at, view_count, unique_session_count, last_notified_at, archived_at"
    )
    .eq("public_id", input.publicId)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !quote) {
    return { ok: false as const, error: "not_found" };
  }

  const ipHash = hashIp(input.ip);
  const now = new Date().toISOString();
  const isFirstView = !quote.first_viewed_at;

  await admin.from("quote_views").insert({
    quote_id: quote.id,
    session_id: input.sessionId || null,
    user_agent: input.userAgent || null,
    referrer: input.referrer || null,
    ip_hash: ipHash,
    viewed_at: now,
  });

  let uniqueSessionCount = quote.unique_session_count || 0;
  if (input.sessionId) {
    const { count } = await admin
      .from("quote_views")
      .select("id", { count: "exact", head: true })
      .eq("quote_id", quote.id)
      .eq("session_id", input.sessionId);

    if ((count || 0) <= 1) {
      uniqueSessionCount += 1;
    }
  }

  const updates: Record<string, unknown> = {
    view_count: (quote.view_count || 0) + 1,
    last_viewed_at: now,
    unique_session_count: uniqueSessionCount,
  };

  if (isFirstView) {
    updates.first_viewed_at = now;
  }

  if (quote.status === "sent" || quote.status === "ready" || isFirstView) {
    updates.status = "opened";
  }

  await admin.from("quotes").update(updates).eq("id", quote.id);

  await maybeNotifyQuoteOpened({
    quote: {
      id: quote.id,
      company_id: quote.company_id,
      created_by: quote.created_by,
      customer_name: quote.customer_name,
      site_address: quote.site_address,
      price_min: quote.price_min,
      price_max: quote.price_max,
      last_notified_at: quote.last_notified_at,
    },
    isFirstView,
  });

  return { ok: true as const, isFirstView };
}
