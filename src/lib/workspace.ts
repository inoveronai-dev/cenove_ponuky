import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo/mode";
import { getDemoSessionUserId } from "@/lib/demo/session";
import { readDemoStore } from "@/lib/demo/store";
import type { Company, PricingSettings, Quote } from "@/types/database";

export type WorkspaceContext = {
  userId: string;
  email: string | null;
  profileName: string | null;
  company: Company;
  pricing: PricingSettings | null;
  membershipRole: string;
  isDemo: boolean;
};

export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  if (isDemoMode()) {
    const userId = await getDemoSessionUserId();
    if (!userId) return null;
    const store = await readDemoStore();
    return {
      userId,
      email: store.profile.email,
      profileName: store.profile.full_name,
      company: store.company,
      pricing: store.pricing,
      membershipRole: "owner",
      isDemo: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const [{ data: company }, { data: pricing }, { data: profile }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("*")
        .eq("id", membership.company_id)
        .single(),
      supabase
        .from("pricing_settings")
        .select("*")
        .eq("company_id", membership.company_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  if (!company) return null;

  return {
    userId: user.id,
    email: profile?.email || user.email || null,
    profileName: profile?.full_name || null,
    company: company as Company,
    pricing: (pricing as PricingSettings) || null,
    membershipRole: membership.role,
    isDemo: false,
  };
}

export async function getCompanyQuotes(
  companyId: string,
  options?: {
    search?: string;
    status?: string;
    includeArchived?: boolean;
  }
) {
  if (isDemoMode()) {
    const store = await readDemoStore();
    let quotes = store.quotes.filter((q) => q.company_id === companyId);
    if (!options?.includeArchived) {
      quotes = quotes.filter((q) => !q.archived_at);
    }
    if (options?.status && options.status !== "all") {
      quotes = quotes.filter((q) => q.status === options.status);
    }
    quotes = [...quotes].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (options?.search) {
      const s = options.search.toLowerCase();
      quotes = quotes.filter(
        (q) =>
          q.customer_name?.toLowerCase().includes(s) ||
          q.site_address?.toLowerCase().includes(s) ||
          q.public_id?.toLowerCase().includes(s)
      );
    }
    return quotes;
  }

  const supabase = await createClient();
  let query = supabase
    .from("quotes")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  let quotes = (data || []) as Quote[];
  if (options?.search) {
    const s = options.search.toLowerCase();
    quotes = quotes.filter(
      (q) =>
        q.customer_name?.toLowerCase().includes(s) ||
        q.site_address?.toLowerCase().includes(s) ||
        q.public_id?.toLowerCase().includes(s)
    );
  }

  return quotes;
}

export async function getCompanyNotifications(companyId: string) {
  if (isDemoMode()) {
    const store = await readDemoStore();
    return [...store.notifications]
      .filter((n) => n.company_id === companyId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 20);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(20);

  return data || [];
}
