"use server";

import { revalidatePath } from "next/cache";
import {
  companySettingsSchema,
  pricingSettingsSchema,
} from "@/lib/quotes/schemas";
import { isDemoMode } from "@/lib/demo/mode";
import { resetDemoStore, updateDemoStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";

export async function updateCompanySettingsAction(raw: unknown) {
  const parsed = companySettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Neplatné údaje." };
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  if (isDemoMode()) {
    await updateDemoStore((store) => {
      store.company = {
        ...store.company,
        ...parsed.data,
        primary_color:
          parsed.data.primary_color ||
          store.company.primary_color ||
          "#2E5894",
        updated_at: new Date().toISOString(),
      };
    });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update(parsed.data)
    .eq("id", ctx.company.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updatePricingSettingsAction(raw: unknown) {
  const parsed = pricingSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Neplatné údaje." };
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  if (isDemoMode()) {
    await updateDemoStore((store) => {
      store.pricing = {
        ...store.pricing,
        ...parsed.data,
        updated_at: new Date().toISOString(),
      };
    });
    revalidatePath("/dashboard/pricing");
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_settings")
    .update(parsed.data)
    .eq("company_id", ctx.company.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/pricing");
  return { ok: true };
}

export async function uploadLogoAction(formData: FormData) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { error: "Vyberte súbor loga." };

  if (isDemoMode()) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type || "image/png"};base64,${buffer.toString("base64")}`;
    await updateDemoStore((store) => {
      store.company.logo_url = base64;
      store.company.updated_at = new Date().toISOString();
    });
    revalidatePath("/dashboard/settings");
    return { ok: true, url: base64 };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `${ctx.company.id}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("company-logos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("company-logos").getPublicUrl(path);

  await supabase
    .from("companies")
    .update({ logo_url: publicUrl })
    .eq("id", ctx.company.id);

  revalidatePath("/dashboard/settings");
  return { ok: true, url: publicUrl };
}

export async function markNotificationsReadAction() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Nie ste prihlásený." };

  if (isDemoMode()) {
    const now = new Date().toISOString();
    await updateDemoStore((store) => {
      store.notifications = store.notifications.map((n) =>
        n.company_id === ctx.company.id && !n.read_at
          ? { ...n, read_at: now }
          : n
      );
    });
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("company_id", ctx.company.id)
    .is("read_at", null);

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function resetDemoDataAction() {
  if (!isDemoMode()) {
    return { error: "Reset je dostupný len v demo režime." };
  }
  await resetDemoStore();
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/quotes");
  return { ok: true };
}
