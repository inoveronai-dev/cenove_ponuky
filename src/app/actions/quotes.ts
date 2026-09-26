"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, format } from "date-fns";
import { CLIENT_BRAND } from "@/lib/brand";
import { generateQuoteCopy, parseQuickInput } from "@/lib/ai/generateQuoteCopy";
import { isDemoMode } from "@/lib/demo/mode";
import { newDemoId, resetDemoStore, updateDemoStore } from "@/lib/demo/store";
import { calculateQuoteEstimate } from "@/lib/pricing/calculateQuoteEstimate";
import { mapPricingSettings } from "@/lib/pricing/mapPricingSettings";
import { generatePublicId, publicQuoteUrl } from "@/lib/quotes/public-id";
import { quoteFormSchema, type QuoteFormValues } from "@/lib/quotes/schemas";
import { sendQuoteEmailToCustomer } from "@/lib/notifications/sendOpenNotification";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import type { Quote, QuoteRow } from "@/types/database";

function buildCustomerName(values: QuoteFormValues): string {
  if (values.customerName?.trim()) return values.customerName.trim();
  return [values.customerFirstName, values.customerLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function formToEstimateInput(values: QuoteFormValues) {
  return {
    estimatedHours: Number(values.estimatedHours) || 0,
    workers: Number(values.workers) || 0,
    distanceKm: Number(values.distanceKm) || 0,
    disassembly: Boolean(values.disassembly),
    assembly: Boolean(values.assembly),
    packing: Boolean(values.packing),
    packingMaterial: Boolean(values.packingMaterial),
    heavyItems: Boolean(values.heavyItems),
    disposal: Boolean(values.disposal),
    protectiveWrapping: Boolean(values.protectiveWrapping),
    otherService: Boolean(values.otherService),
    isWeekend: Boolean(values.isWeekend),
    isEvening: Boolean(values.isEvening),
  };
}

function toDbPayload(
  values: QuoteFormValues,
  extras: {
    companyId: string;
    userId: string;
    publicId?: string;
    status: Quote["status"] | string;
    estimate: ReturnType<typeof calculateQuoteEstimate>;
    copy: Awaited<ReturnType<typeof generateQuoteCopy>>;
    validUntil: string;
  }
) {
  const customerName = buildCustomerName(values);
  return {
    public_id: extras.publicId,
    company_id: extras.companyId,
    created_by: extras.userId,
    status: extras.status,
    customer_first_name: values.customerFirstName || null,
    customer_last_name: values.customerLastName || null,
    customer_name: customerName,
    customer_email: values.customerEmail || null,
    customer_phone: values.customerPhone || null,
    origin_address: values.originAddress || null,
    destination_address: values.destinationAddress || null,
    origin_property_type: values.originPropertyType || null,
    origin_floor: values.originFloor ?? null,
    origin_elevator: values.originElevator ?? null,
    destination_floor: values.destinationFloor ?? null,
    destination_elevator: values.destinationElevator ?? null,
    distance_km: values.distanceKm ?? null,
    box_count: values.boxCount ?? null,
    large_items: values.largeItems || null,
    wardrobes_count: values.wardrobesCount ?? null,
    beds_count: values.bedsCount ?? null,
    sofas_count: values.sofasCount ?? null,
    appliances_count: values.appliancesCount ?? null,
    disassembly: Boolean(values.disassembly),
    assembly: Boolean(values.assembly),
    packing: Boolean(values.packing),
    packing_material: Boolean(values.packingMaterial),
    disposal: Boolean(values.disposal),
    heavy_items: Boolean(values.heavyItems),
    protective_wrapping: Boolean(values.protectiveWrapping),
    other_service: Boolean(values.otherService),
    move_date: values.moveDate || null,
    estimated_hours: values.estimatedHours ?? null,
    workers: values.workers ?? null,
    vehicle_type: values.vehicleType || null,
    is_weekend: Boolean(values.isWeekend),
    is_evening: Boolean(values.isEvening),
    internal_notes: values.internalNotes || null,
    customer_notes: values.customerNotes || null,
    ai_intro: extras.copy.aiIntro,
    ai_summary: extras.copy.aiSummary,
    ai_scope_note: extras.copy.aiScopeNote,
    labor_amount: extras.estimate.laborCost,
    transport_amount: extras.estimate.transportCost,
    extras_amount: extras.estimate.extrasCost,
    base_estimate: extras.estimate.baseEstimate,
    price_min:
      values.priceIsManual && values.priceMin != null
        ? Number(values.priceMin)
        : extras.estimate.priceMin,
    price_max:
      values.priceIsManual && values.priceMax != null
        ? Number(values.priceMax)
        : extras.estimate.priceMax,
    price_is_manual: Boolean(values.priceIsManual),
    valid_until: extras.validUntil,
  };
}

function payloadToQuote(
  payload: ReturnType<typeof toDbPayload>,
  id: string
): QuoteRow {
  const now = new Date().toISOString();
  return {
    id,
    public_id: payload.public_id!,
    company_id: payload.company_id,
    created_by: payload.created_by,
    status: payload.status as Quote["status"],
    customer_first_name: payload.customer_first_name,
    customer_last_name: payload.customer_last_name,
    customer_name: payload.customer_name,
    customer_email: payload.customer_email,
    customer_phone: payload.customer_phone,
    origin_address: payload.origin_address,
    destination_address: payload.destination_address,
    origin_property_type: payload.origin_property_type,
    origin_floor: payload.origin_floor,
    origin_elevator: payload.origin_elevator,
    destination_floor: payload.destination_floor,
    destination_elevator: payload.destination_elevator,
    distance_km: payload.distance_km,
    box_count: payload.box_count,
    large_items: payload.large_items,
    wardrobes_count: payload.wardrobes_count,
    beds_count: payload.beds_count,
    sofas_count: payload.sofas_count,
    appliances_count: payload.appliances_count,
    disassembly: payload.disassembly,
    assembly: payload.assembly,
    packing: payload.packing,
    packing_material: payload.packing_material,
    disposal: payload.disposal,
    heavy_items: payload.heavy_items,
    protective_wrapping: payload.protective_wrapping,
    other_service: payload.other_service,
    additional_services: {},
    move_date: payload.move_date,
    estimated_hours: payload.estimated_hours,
    workers: payload.workers,
    vehicle_type: payload.vehicle_type,
    is_weekend: payload.is_weekend,
    is_evening: payload.is_evening,
    internal_notes: payload.internal_notes,
    customer_notes: payload.customer_notes,
    ai_intro: payload.ai_intro,
    ai_summary: payload.ai_summary,
    ai_scope_note: payload.ai_scope_note,
    labor_amount: payload.labor_amount,
    transport_amount: payload.transport_amount,
    extras_amount: payload.extras_amount,
    base_estimate: payload.base_estimate,
    price_min: payload.price_min,
    price_max: payload.price_max,
    price_is_manual: payload.price_is_manual,
    valid_until: payload.valid_until,
    sent_at: null,
    first_viewed_at: null,
    last_viewed_at: null,
    view_count: 0,
    unique_session_count: 0,
    last_notified_at: null,
    version: 1,
    archived_at: null,
    created_at: now,
    updated_at: now,
  };
}

export async function createQuoteAction(raw: QuoteFormValues) {
  const parsed = quoteFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Neplatné údaje." };
  }

  const values = parsed.data;
  const customerName = buildCustomerName(values);
  if (!customerName) {
    return { error: "Zadajte meno zákazníka." };
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  const pricing = mapPricingSettings(ctx.pricing);
  const estimate = calculateQuoteEstimate(formToEstimateInput(values), pricing);
  const copy = await generateQuoteCopy({
    customerName,
    customerFirstName: values.customerFirstName,
    originAddress: values.originAddress,
    destinationAddress: values.destinationAddress,
    originPropertyType: values.originPropertyType,
    boxCount: values.boxCount,
    largeItems: values.largeItems,
    disassembly: values.disassembly,
    assembly: values.assembly,
    packing: values.packing,
    moveDate: values.moveDate,
    customerNotes: values.customerNotes,
  });

  const validUntil = format(
    addDays(new Date(), ctx.company.quote_validity_days || 14),
    "yyyy-MM-dd"
  );

  if (isDemoMode()) {
    const publicId = generatePublicId();
    const id = newDemoId("quote");
    const payload = toDbPayload(values, {
      companyId: ctx.company.id,
      userId: ctx.userId,
      publicId,
      status: values.saveAsDraft ? "draft" : "ready",
      estimate,
      copy,
      validUntil,
    });
    const quote = payloadToQuote(payload, id);
    await updateDemoStore((store) => {
      store.quotes.unshift(quote);
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/quotes");
    redirect(`/dashboard/quotes/${id}`);
  }

  const supabase = await createClient();
  let publicId = generatePublicId();
  let attempts = 0;
  let inserted: Quote | null = null;

  while (attempts < 5 && !inserted) {
    const payload = toDbPayload(values, {
      companyId: ctx.company.id,
      userId: ctx.userId,
      publicId,
      status: values.saveAsDraft ? "draft" : "ready",
      estimate,
      copy,
      validUntil,
    });

    const { data, error } = await supabase
      .from("quotes")
      .insert(payload)
      .select("*")
      .single();

    if (!error && data) {
      inserted = data as Quote;
      break;
    }

    if (error?.code === "23505") {
      publicId = generatePublicId();
      attempts += 1;
      continue;
    }

    return { error: error?.message || "Nepodarilo sa vytvoriť ponuku." };
  }

  if (!inserted) {
    return { error: "Nepodarilo sa vytvoriť unikátny identifikátor ponuky." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/quotes");
  redirect(`/dashboard/quotes/${inserted.id}`);
}

export async function updateQuoteAction(quoteId: string, raw: QuoteFormValues) {
  const parsed = quoteFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Neplatné údaje." };
  }

  const values = parsed.data;
  const customerName = buildCustomerName(values);
  if (!customerName) return { error: "Zadajte meno zákazníka." };

  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  const pricing = mapPricingSettings(ctx.pricing);
  const estimate = calculateQuoteEstimate(formToEstimateInput(values), pricing);
  const copy = await generateQuoteCopy({
    customerName,
    customerFirstName: values.customerFirstName,
    originAddress: values.originAddress,
    destinationAddress: values.destinationAddress,
    originPropertyType: values.originPropertyType,
    boxCount: values.boxCount,
    largeItems: values.largeItems,
    disassembly: values.disassembly,
    assembly: values.assembly,
    packing: values.packing,
    moveDate: values.moveDate,
    customerNotes: values.customerNotes,
  });

  if (isDemoMode()) {
    let found = false;
    await updateDemoStore((store) => {
      const idx = store.quotes.findIndex(
        (q) => q.id === quoteId && q.company_id === ctx.company.id
      );
      if (idx < 0) return;
      found = true;
      const quote = store.quotes[idx];
      const needsVersion = quote.status === "sent" || quote.status === "opened";
      if (needsVersion) {
        store.quote_versions.push({
          id: newDemoId("ver"),
          quote_id: quote.id,
          version_number: quote.version || 1,
          snapshot: quote as unknown as Record<string, unknown>,
          created_by: ctx.userId,
          created_at: new Date().toISOString(),
        });
      }

      const validUntil =
        quote.valid_until ||
        format(
          addDays(new Date(), ctx.company.quote_validity_days || 14),
          "yyyy-MM-dd"
        );

      const payload = toDbPayload(values, {
        companyId: ctx.company.id,
        userId: ctx.userId,
        status: values.saveAsDraft
          ? "draft"
          : quote.status === "draft"
            ? "ready"
            : quote.status,
        estimate,
        copy,
        validUntil,
      });

      store.quotes[idx] = {
        ...quote,
        ...payload,
        public_id: quote.public_id,
        version: needsVersion ? (quote.version || 1) + 1 : quote.version,
        updated_at: new Date().toISOString(),
      } as Quote;
    });

    if (!found) return { error: "Ponuka neexistuje." };
    revalidatePath(`/dashboard/quotes/${quoteId}`);
    revalidatePath("/dashboard/quotes");
    revalidatePath("/dashboard");
    redirect(`/dashboard/quotes/${quoteId}`);
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("company_id", ctx.company.id)
    .single();

  if (fetchError || !existing) {
    return { error: "Ponuka neexistuje." };
  }

  const quote = existing as Quote;
  const needsVersion = quote.status === "sent" || quote.status === "opened";

  if (needsVersion) {
    await supabase.from("quote_versions").insert({
      quote_id: quote.id,
      version_number: quote.version || 1,
      snapshot: quote as unknown as Record<string, unknown>,
      created_by: ctx.userId,
    });
  }

  const validUntil =
    quote.valid_until ||
    format(addDays(new Date(), ctx.company.quote_validity_days || 14), "yyyy-MM-dd");

  const payload = toDbPayload(values, {
    companyId: ctx.company.id,
    userId: ctx.userId,
    status: values.saveAsDraft
      ? "draft"
      : quote.status === "draft"
        ? "ready"
        : quote.status,
    estimate,
    copy,
    validUntil,
  });

  delete (payload as { public_id?: string }).public_id;

  const { error } = await supabase
    .from("quotes")
    .update({
      ...payload,
      version: needsVersion ? (quote.version || 1) + 1 : quote.version,
    })
    .eq("id", quoteId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/quotes/${quoteId}`);
  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard");
  redirect(`/dashboard/quotes/${quoteId}`);
}

export async function parseQuickInputAction(text: string) {
  if (!text.trim()) return { error: "Zadajte popis zákazky." };
  const data = await parseQuickInput(text);
  return { data };
}

export async function duplicateQuoteAction(quoteId: string) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  if (isDemoMode()) {
    let newId = "";
    await updateDemoStore((store) => {
      const quote = store.quotes.find(
        (q) => q.id === quoteId && q.company_id === ctx.company.id
      );
      if (!quote) return;
      newId = newDemoId("quote");
      const now = new Date().toISOString();
      store.quotes.unshift({
        ...structuredClone(quote),
        id: newId,
        public_id: generatePublicId(),
        status: "draft",
        created_by: ctx.userId,
        view_count: 0,
        unique_session_count: 0,
        version: 1,
        sent_at: null,
        first_viewed_at: null,
        last_viewed_at: null,
        last_notified_at: null,
        archived_at: null,
        created_at: now,
        updated_at: now,
      });
    });
    if (!newId) return { error: "Ponuka neexistuje." };
    revalidatePath("/dashboard/quotes");
    redirect(`/dashboard/quotes/${newId}/edit`);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("company_id", ctx.company.id)
    .single();

  if (!existing) return { error: "Ponuka neexistuje." };
  const quote = existing as Quote;

  const {
    id: _id,
    public_id: _pid,
    created_at: _c,
    updated_at: _u,
    sent_at: _s,
    first_viewed_at: _f,
    last_viewed_at: _l,
    view_count: _v,
    unique_session_count: _us,
    last_notified_at: _n,
    archived_at: _a,
    ...rest
  } = quote;

  void _id;
  void _pid;
  void _c;
  void _u;
  void _s;
  void _f;
  void _l;
  void _v;
  void _us;
  void _n;
  void _a;

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      ...rest,
      public_id: generatePublicId(),
      status: "draft",
      created_by: ctx.userId,
      view_count: 0,
      unique_session_count: 0,
      version: 1,
      sent_at: null,
      first_viewed_at: null,
      last_viewed_at: null,
      last_notified_at: null,
      archived_at: null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Duplikácia zlyhala." };

  revalidatePath("/dashboard/quotes");
  redirect(`/dashboard/quotes/${data.id}/edit`);
}

export async function archiveQuoteAction(quoteId: string) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  if (isDemoMode()) {
    await updateDemoStore((store) => {
      const quote = store.quotes.find(
        (q) => q.id === quoteId && q.company_id === ctx.company.id
      );
      if (quote) quote.archived_at = new Date().toISOString();
    });
    revalidatePath("/dashboard/quotes");
    revalidatePath("/dashboard");
    redirect("/dashboard/quotes");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("company_id", ctx.company.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard");
  redirect("/dashboard/quotes");
}

export async function markQuoteSentAction(quoteId: string) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  if (isDemoMode()) {
    await updateDemoStore((store) => {
      const quote = store.quotes.find(
        (q) => q.id === quoteId && q.company_id === ctx.company.id
      );
      if (!quote) return;
      quote.sent_at = new Date().toISOString();
      if (quote.status !== "opened") quote.status = "sent";
    });
    revalidatePath(`/dashboard/quotes/${quoteId}`);
    return { ok: true };
  }

  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("status")
    .eq("id", quoteId)
    .eq("company_id", ctx.company.id)
    .single();

  if (!quote) return { error: "Ponuka neexistuje." };

  const updates: Record<string, unknown> = {
    sent_at: new Date().toISOString(),
  };
  if (quote.status !== "opened") {
    updates.status = "sent";
  }

  await supabase.from("quotes").update(updates).eq("id", quoteId);
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  return { ok: true };
}

export async function sendQuoteEmailAction(quoteId: string) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  let quote: Quote | null = null;

  if (isDemoMode()) {
    const { readDemoStore } = await import("@/lib/demo/store");
    const store = await readDemoStore();
    quote =
      store.quotes.find(
        (q) => q.id === quoteId && q.company_id === ctx.company.id
      ) || null;
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .eq("company_id", ctx.company.id)
      .single();
    quote = (data as Quote) || null;
  }

  if (!quote) return { error: "Ponuka neexistuje." };
  if (!quote.customer_email) {
    return { error: "Zákazník nemá vyplnený e-mail." };
  }

  const result = await sendQuoteEmailToCustomer({
    to: quote.customer_email,
    customerName: quote.customer_name,
    companyName: ctx.company.name,
    quoteUrl: publicQuoteUrl(quote.public_id),
    fromEmail: process.env.NOTIFICATION_FROM_EMAIL,
  });

  if (!result.ok) return { error: result.error };

  await markQuoteSentAction(quoteId);
  return { ok: true };
}

export async function seedDemoCompanyAction() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  if (isDemoMode()) {
    await resetDemoStore();
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/quotes");
    return { ok: true };
  }

  const supabase = await createClient();

  await supabase
    .from("companies")
    .update({
      name: CLIENT_BRAND.legalName,
      subtitle: CLIENT_BRAND.subtitle,
      address: CLIENT_BRAND.address,
      ico: "12345678",
      dic: "2023456789",
      ic_dph: "SK2023456789",
      email: CLIENT_BRAND.email,
      phone: CLIENT_BRAND.phone,
      website: CLIENT_BRAND.website,
      logo_url: CLIENT_BRAND.logoPath,
      primary_color: CLIENT_BRAND.primary,
      notification_email: ctx.email,
    })
    .eq("id", ctx.company.id);

  await supabase
    .from("pricing_settings")
    .update({
      hourly_rate_per_worker: 38,
      kilometer_rate: 0.65,
      fixed_fee: 90,
      disassembly_surcharge: 70,
      buffer_min_multiplier: 0.92,
      buffer_max_multiplier: 1.12,
    })
    .eq("company_id", ctx.company.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
