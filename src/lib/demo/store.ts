import { promises as fs } from "fs";
import path from "path";
import { addDays, format } from "date-fns";
import { CLIENT_BRAND } from "@/lib/brand";
import {
  DEMO_COMPANY_ID,
  DEMO_PRICING_ID,
  DEMO_USER_ID,
} from "@/lib/demo/mode";
import { calculateQuoteEstimate, DEFAULT_PRICING } from "@/lib/pricing/calculateQuoteEstimate";
import { buildFallbackCopy } from "@/lib/ai/generateQuoteCopy";
import type {
  Company,
  Notification,
  PricingSettings,
  Quote,
  QuoteView,
  QuoteRow,
} from "@/types/database";

export type DemoStore = {
  company: Company;
  pricing: PricingSettings;
  profile: {
    id: string;
    full_name: string;
    email: string;
  };
  quotes: Quote[];
  quote_views: QuoteView[];
  quote_versions: {
    id: string;
    quote_id: string;
    version_number: number;
    snapshot: Record<string, unknown>;
    created_by: string | null;
    created_at: string;
  }[];
  notifications: Notification[];
};

const STORE_PATH = path.join(process.cwd(), ".data", "demo-store.json");

function nowIso() {
  return new Date().toISOString();
}

function createSeedStore(): DemoStore {
  const created = nowIso();
  const estimate = calculateQuoteEstimate(
    {
      estimatedHours: 6,
      workers: 3,
      distanceKm: 55,
      disassembly: true,
    },
    DEFAULT_PRICING
  );
  const copy = buildFallbackCopy({
    customerName: "Ján Novák",
    customerFirstName: "Ján",
    originAddress: "Bratislava – Ružinov",
    destinationAddress: "Trnava",
    originPropertyType: "3_izbovy",
    boxCount: 35,
    largeItems: "sedačka, posteľ, práčka, 2 skrine",
    disassembly: true,
    moveDate: "2026-09-28",
  });

  const company: Company = {
    id: DEMO_COMPANY_ID,
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
    quote_validity_days: 14,
    notify_on_first_open: true,
    notify_on_later_open: true,
    notification_cooldown_hours: 3,
    notification_email: "demo@movequote.sk",
    created_at: created,
    updated_at: created,
  };

  const pricing: PricingSettings = {
    id: DEMO_PRICING_ID,
    company_id: DEMO_COMPANY_ID,
    hourly_rate_per_worker: DEFAULT_PRICING.hourlyRatePerWorker,
    kilometer_rate: DEFAULT_PRICING.kilometerRate,
    route_multiplier: DEFAULT_PRICING.routeMultiplier,
    fixed_fee: DEFAULT_PRICING.fixedFee,
    disassembly_surcharge: DEFAULT_PRICING.disassemblySurcharge,
    assembly_surcharge: DEFAULT_PRICING.assemblySurcharge,
    packing_surcharge: DEFAULT_PRICING.packingSurcharge,
    packing_material_surcharge: DEFAULT_PRICING.packingMaterialSurcharge,
    heavy_items_surcharge: DEFAULT_PRICING.heavyItemsSurcharge,
    disposal_surcharge: DEFAULT_PRICING.disposalSurcharge,
    protective_wrapping_surcharge: DEFAULT_PRICING.protectiveWrappingSurcharge,
    other_surcharge: DEFAULT_PRICING.otherSurcharge,
    minimum_job_price: DEFAULT_PRICING.minimumJobPrice,
    weekend_surcharge_percent: DEFAULT_PRICING.weekendSurchargePercent,
    evening_surcharge_percent: DEFAULT_PRICING.eveningSurchargePercent,
    buffer_min_multiplier: DEFAULT_PRICING.bufferMinMultiplier,
    buffer_max_multiplier: DEFAULT_PRICING.bufferMaxMultiplier,
    created_at: created,
    updated_at: created,
  };

  const quote: QuoteRow = {
    id: "demo-quote-novak",
    public_id: "7K4X2P",
    company_id: DEMO_COMPANY_ID,
    created_by: DEMO_USER_ID,
    status: "ready",
    customer_first_name: "Ján",
    customer_last_name: "Novák",
    customer_name: "Ján Novák",
    customer_email: "jan.novak@email.sk",
    customer_phone: "+421 905 111 222",
    origin_address: "Bratislava – Ružinov",
    destination_address: "Trnava",
    origin_property_type: "3_izbovy",
    origin_floor: 4,
    origin_elevator: true,
    destination_floor: 2,
    destination_elevator: true,
    distance_km: 55,
    box_count: 35,
    large_items: "sedačka, posteľ, práčka, 2 skrine",
    wardrobes_count: 2,
    beds_count: 1,
    sofas_count: 1,
    appliances_count: 1,
    disassembly: true,
    assembly: false,
    packing: false,
    packing_material: false,
    disposal: false,
    heavy_items: false,
    protective_wrapping: false,
    other_service: false,
    additional_services: {},
    move_date: "2026-09-28",
    estimated_hours: 6,
    workers: 3,
    vehicle_type: "velka_dodavka",
    is_weekend: false,
    is_evening: false,
    internal_notes: "Demo ponuka — údaje môžete kedykoľvek zmeniť.",
    customer_notes: "Klient preferuje ranný začiatok.",
    ai_intro: copy.aiIntro,
    ai_summary: copy.aiSummary,
    ai_scope_note: copy.aiScopeNote,
    labor_amount: estimate.laborCost,
    transport_amount: estimate.transportCost,
    extras_amount: estimate.extrasCost,
    base_estimate: estimate.baseEstimate,
    price_min: estimate.priceMin,
    price_max: estimate.priceMax,
    price_is_manual: false,
    valid_until: format(addDays(new Date(), 14), "yyyy-MM-dd"),
    sent_at: null,
    first_viewed_at: null,
    last_viewed_at: null,
    view_count: 0,
    unique_session_count: 0,
    last_notified_at: null,
    version: 1,
    archived_at: null,
    created_at: created,
    updated_at: created,
  };

  return {
    company,
    pricing,
    profile: {
      id: DEMO_USER_ID,
      full_name: "Demo obchodník",
      email: "demo@movequote.sk",
    },
    quotes: [quote],
    quote_views: [],
    quote_versions: [],
    notifications: [],
  };
}

let memoryCache: DemoStore | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function ensureLoaded(): Promise<DemoStore> {
  if (memoryCache) return memoryCache;

  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as DemoStore;
    parsed.quotes = (parsed.quotes || []).map((q) => ({
      ...q,
      price_is_manual: Boolean(q.price_is_manual),
    }));
    // Keep demo company on current TOP okno branding
    if (parsed.company) {
      parsed.company = {
        ...parsed.company,
        name: CLIENT_BRAND.legalName,
        subtitle: CLIENT_BRAND.subtitle,
        address: parsed.company.address || CLIENT_BRAND.address,
        logo_url: CLIENT_BRAND.logoPath,
        primary_color: CLIENT_BRAND.primary,
        email: parsed.company.email || CLIENT_BRAND.email,
        phone: parsed.company.phone || CLIENT_BRAND.phone,
        website: parsed.company.website || CLIENT_BRAND.website,
      };
      memoryCache = parsed;
      try {
        await persist(memoryCache);
      } catch {
        // Keep in-memory branding if disk write fails
      }
      return memoryCache;
    }
    memoryCache = parsed;
    return memoryCache;
  } catch {
    memoryCache = createSeedStore();
    try {
      await persist(memoryCache);
    } catch {
      // Keep in-memory seed if disk is unavailable
    }
    return memoryCache;
  }
}

async function persist(store: DemoStore) {
  memoryCache = store;
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
      await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    } catch (err) {
      console.error("Demo store write failed:", err);
    }
  });
  await writeQueue;
}

export async function readDemoStore(): Promise<DemoStore> {
  return ensureLoaded();
}

export async function updateDemoStore(
  mutator: (store: DemoStore) => void | DemoStore
): Promise<DemoStore> {
  const store = structuredClone(await ensureLoaded());
  const result = mutator(store);
  const next = (result as DemoStore | void) || store;
  await persist(next);
  return next;
}

export async function resetDemoStore(): Promise<DemoStore> {
  const store = createSeedStore();
  await persist(store);
  return store;
}

export function newDemoId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
