import { hasSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Demo mode runs without Supabase:
 * - automatically when Supabase env is missing, OR
 * - when DEMO_MODE=true (even if Supabase keys exist — useful for local demos)
 *
 * Data persists in `.data/demo-store.json` on the server (not production DB).
 */
export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  return !hasSupabasePublicEnv();
}

export const DEMO_SESSION_COOKIE = "mq_demo_session";
export const DEMO_USER_ID = "demo-user-1";
export const DEMO_COMPANY_ID = "demo-company-1";
export const DEMO_PRICING_ID = "demo-pricing-1";
