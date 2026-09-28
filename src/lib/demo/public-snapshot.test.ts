import { describe, expect, it } from "vitest";
import {
  decodePublicSnapshot,
  encodePublicSnapshot,
  publicQuoteSharePath,
} from "./public-snapshot";
import type { Quote } from "@/types/database";

const quote = {
  id: "q1",
  public_id: "ABC123",
  company_id: "demo-company-1",
  created_by: "demo-user-1",
  status: "ready",
  customer_first_name: "Martin",
  customer_last_name: "Horváth",
  customer_name: "Martin Horváth",
  customer_email: null,
  customer_phone: "0905 381 691",
  site_address: "Vysoká 5, Trenčín",
  property_type: "rodinny_dom",
  floor: null,
  line_items: [
    {
      id: "i1",
      category: "plastove_okna",
      widthMm: 1200,
      heightMm: 1800,
      count: 9,
      color: "modrá",
      glazing: "dvojsklo",
      notes: null,
    },
  ],
  montaz: true,
  demontaz_starych: false,
  likvidacia: false,
  parapet_vnutorny: false,
  parapet_vonkajsi: false,
  siete_proti_hmyzu: true,
  other_service: false,
  install_date: "2026-09-29",
  internal_notes: "secret",
  customer_notes: null,
  ai_intro: "Intro",
  ai_summary: "Summary",
  ai_scope_note: "Scope",
  products_amount: 1000,
  montaz_amount: 200,
  extras_amount: 50,
  base_estimate: 1250,
  price_min: 1200,
  price_max: 1400,
  price_is_manual: false,
  valid_until: "2026-10-13",
  sent_at: null,
  first_viewed_at: null,
  last_viewed_at: null,
  view_count: 0,
  unique_session_count: 0,
  last_notified_at: null,
  version: 1,
  archived_at: null,
  created_at: "2026-09-28T00:00:00.000Z",
  updated_at: "2026-09-28T00:00:00.000Z",
} as Quote;

const company = {
  id: "demo-company-1",
  name: "TOP Okno",
  subtitle: "Trenčín",
  address: "Test",
  ico: "123",
  dic: null,
  ic_dph: null,
  email: "a@b.sk",
  phone: "0900",
  website: null,
  logo_url: null,
  primary_color: "#123",
};

describe("public-snapshot", () => {
  it("round-trips encode/decode", () => {
    const encoded = encodePublicSnapshot({ quote, company });
    const decoded = decodePublicSnapshot(encoded);
    expect(decoded?.quote.public_id).toBe("ABC123");
    expect(decoded?.quote.site_address).toBe("Vysoká 5, Trenčín");
    expect(decoded?.quote.internal_notes).toBeNull();
    expect(decoded?.company.name).toBe("TOP Okno");
  });

  it("builds share path with embedded payload", () => {
    const path = publicQuoteSharePath({ quote, company });
    expect(path.startsWith("/ponuka/ABC123?d=")).toBe(true);
    const d = path.split("?d=")[1];
    expect(decodePublicSnapshot(d)?.quote.customer_name).toBe("Martin Horváth");
  });
});
