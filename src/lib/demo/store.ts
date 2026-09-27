import { promises as fs } from "fs";
import path from "path";
import { deflateSync, inflateSync } from "zlib";
import { cookies } from "next/headers";
import { addDays, format } from "date-fns";
import { CLIENT_BRAND } from "@/lib/brand";
import {
  DEMO_COMPANY_ID,
  DEMO_PRICING_ID,
  DEMO_USER_ID,
} from "@/lib/demo/mode";
import {
  calculateQuoteEstimate,
  DEFAULT_PRICING,
} from "@/lib/pricing/calculateQuoteEstimate";
import { buildFallbackCopy } from "@/lib/ai/generateQuoteCopy";
import type {
  Company,
  Notification,
  PricingSettings,
  Quote,
  QuoteView,
  QuoteRow,
  QuoteLineItem,
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

type GlobalDemo = {
  __movequoteDemoStore?: DemoStore;
  __movequoteDemoWriteQueue?: Promise<void>;
};

const g = globalThis as unknown as GlobalDemo;

const COOKIE_NAME = "mq_demo_store";
const COOKIE_MAX = 3500;

function storePath() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "movequote-demo-store.json");
  }
  return path.join(process.cwd(), ".data", "demo-store.json");
}

function nowIso() {
  return new Date().toISOString();
}

function createSeedStore(): DemoStore {
  const created = nowIso();
  const lineItems: QuoteLineItem[] = [
    {
      id: "item-1",
      category: "plastove_okna",
      widthMm: 1200,
      heightMm: 1400,
      count: 4,
      color: "biela",
      glazing: "trojsklo",
      notes: null,
    },
    {
      id: "item-2",
      category: "plastove_dvere",
      widthMm: 900,
      heightMm: 2100,
      count: 1,
      color: "antracit",
      glazing: "trojsklo",
      notes: "vchodové dvere s výplňou GAVAplast",
    },
    {
      id: "item-3",
      category: "tieniaca_technika",
      widthMm: 1200,
      heightMm: 1400,
      count: 4,
      color: null,
      glazing: null,
      notes: "predokenné vonkajšie rolety",
    },
  ];

  const estimate = calculateQuoteEstimate(
    {
      items: lineItems,
      montaz: true,
      demontazStarych: true,
      likvidacia: true,
      parapetVnutorny: true,
      parapetVonkajsi: true,
    },
    DEFAULT_PRICING
  );

  const copy = buildFallbackCopy({
    customerName: "Ján Novák",
    customerFirstName: "Ján",
    siteAddress: "Zlatovská 45, Trenčín",
    propertyType: "rodinny_dom",
    floor: 0,
    lineItems,
    montaz: true,
    demontazStarych: true,
    likvidacia: true,
    parapetVnutorny: true,
    parapetVonkajsi: true,
    installDate: "2026-10-15",
  });

  const company: Company = {
    id: DEMO_COMPANY_ID,
    name: CLIENT_BRAND.legalName,
    subtitle: CLIENT_BRAND.subtitle,
    address: CLIENT_BRAND.address,
    ico: CLIENT_BRAND.ico,
    dic: null,
    ic_dph: CLIENT_BRAND.icDph,
    email: CLIENT_BRAND.email,
    phone: CLIENT_BRAND.phone,
    website: CLIENT_BRAND.website,
    logo_url: CLIENT_BRAND.logoPath,
    primary_color: CLIENT_BRAND.primary,
    quote_validity_days: 14,
    notify_on_first_open: true,
    notify_on_later_open: true,
    notification_cooldown_hours: 3,
    notification_email: CLIENT_BRAND.email,
    created_at: created,
    updated_at: created,
  };

  const pricing: PricingSettings = {
    id: DEMO_PRICING_ID,
    company_id: DEMO_COMPANY_ID,
    price_per_m2_plastove_okna: DEFAULT_PRICING.pricePerM2PlastoveOkna,
    price_per_m2_plastove_dvere: DEFAULT_PRICING.pricePerM2PlastoveDvere,
    price_per_m2_hlinik: DEFAULT_PRICING.pricePerM2Hlinik,
    price_per_m2_interierove_dvere: DEFAULT_PRICING.pricePerM2InterieroveDvere,
    price_per_m2_tieniaca: DEFAULT_PRICING.pricePerM2Tieniaca,
    price_per_m2_garazove_brany: DEFAULT_PRICING.pricePerM2GarazoveBrany,
    fixed_fee: DEFAULT_PRICING.fixedFee,
    montaz_per_m2: DEFAULT_PRICING.montazPerM2,
    demontaz_per_unit: DEFAULT_PRICING.demontazPerUnit,
    likvidacia_fee: DEFAULT_PRICING.likvidaciaFee,
    parapet_vnutorny_fee: DEFAULT_PRICING.parapetVnutornyFee,
    parapet_vonkajsi_fee: DEFAULT_PRICING.parapetVonkajsiFee,
    siete_fee: DEFAULT_PRICING.sieteFee,
    other_surcharge: DEFAULT_PRICING.otherSurcharge,
    minimum_job_price: DEFAULT_PRICING.minimumJobPrice,
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
    site_address: "Zlatovská 45, Trenčín",
    property_type: "rodinny_dom",
    floor: 0,
    line_items: lineItems,
    montaz: true,
    demontaz_starych: true,
    likvidacia: true,
    parapet_vnutorny: true,
    parapet_vonkajsi: true,
    siete_proti_hmyzu: false,
    other_service: false,
    install_date: "2026-10-15",
    internal_notes: "Demo ponuka — údaje môžete kedykoľvek zmeniť.",
    customer_notes: "Zákazník preferuje antracitový dekor na vchodových dverách.",
    ai_intro: copy.aiIntro,
    ai_summary: copy.aiSummary,
    ai_scope_note: copy.aiScopeNote,
    products_amount: estimate.productsCost,
    montaz_amount: estimate.montazCost,
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
      full_name: "Obchodný zástupca",
      email: CLIENT_BRAND.email,
    },
    quotes: [quote],
    quote_views: [],
    quote_versions: [],
    notifications: [],
  };
}

function isWindowDomainStore(store: DemoStore): boolean {
  const quote = store.quotes?.[0] as QuoteRow | undefined;
  const pricing = store.pricing as PricingSettings | undefined;
  return Boolean(
    quote &&
      Array.isArray(quote.line_items) &&
      pricing &&
      "price_per_m2_plastove_okna" in pricing
  );
}

function compressStore(store: DemoStore): string {
  return deflateSync(Buffer.from(JSON.stringify(store), "utf8")).toString(
    "base64url"
  );
}

function decompressStore(raw: string): DemoStore | null {
  try {
    const json = inflateSync(Buffer.from(raw, "base64url")).toString("utf8");
    return JSON.parse(json) as DemoStore;
  } catch {
    return null;
  }
}

async function readCookieStore(): Promise<DemoStore | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    const parsed = decompressStore(raw);
    if (!parsed || !isWindowDomainStore(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCookieStore(store: DemoStore) {
  try {
    const packed = compressStore(store);
    if (packed.length > COOKIE_MAX) {
      // Prefer keeping latest quotes so newly created public links work
      const slim: DemoStore = {
        ...store,
        quote_views: [],
        quote_versions: [],
        notifications: [],
        quotes: store.quotes.slice(0, 8),
      };
      const packedSlim = compressStore(slim);
      if (packedSlim.length > COOKIE_MAX) return;
      const jar = await cookies();
      jar.set(COOKIE_NAME, packedSlim, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.VERCEL === "1",
        maxAge: 60 * 60 * 24 * 30,
      });
      return;
    }
    const jar = await cookies();
    jar.set(COOKIE_NAME, packed, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.VERCEL === "1",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch (err) {
    console.error("Demo cookie write failed:", err);
  }
}

function normalizeQuotes(store: DemoStore): DemoStore {
  store.quotes = (store.quotes || []).map((q) => ({
    ...q,
    price_is_manual: Boolean(q.price_is_manual),
    line_items: Array.isArray(q.line_items) ? q.line_items : [],
  }));
  if (store.company) {
    store.company = {
      ...store.company,
      name: CLIENT_BRAND.legalName,
      subtitle: CLIENT_BRAND.subtitle,
      address: CLIENT_BRAND.address,
      ico: CLIENT_BRAND.ico,
      ic_dph: CLIENT_BRAND.icDph,
      logo_url: CLIENT_BRAND.logoPath,
      primary_color: CLIENT_BRAND.primary,
      email: CLIENT_BRAND.email,
      phone: CLIENT_BRAND.phone,
      website: CLIENT_BRAND.website,
    };
  }
  return store;
}

async function ensureLoaded(): Promise<DemoStore> {
  if (g.__movequoteDemoStore) return g.__movequoteDemoStore;

  const fromCookie = await readCookieStore();
  if (fromCookie) {
    g.__movequoteDemoStore = normalizeQuotes(fromCookie);
    return g.__movequoteDemoStore;
  }

  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as DemoStore;
    if (!isWindowDomainStore(parsed)) {
      g.__movequoteDemoStore = createSeedStore();
      await persist(g.__movequoteDemoStore);
      return g.__movequoteDemoStore;
    }
    g.__movequoteDemoStore = normalizeQuotes(parsed);
    await writeCookieStore(g.__movequoteDemoStore);
    return g.__movequoteDemoStore;
  } catch {
    g.__movequoteDemoStore = createSeedStore();
    await persist(g.__movequoteDemoStore);
    return g.__movequoteDemoStore;
  }
}

async function persist(store: DemoStore) {
  g.__movequoteDemoStore = store;
  await writeCookieStore(store);

  g.__movequoteDemoWriteQueue = (g.__movequoteDemoWriteQueue || Promise.resolve())
    .then(async () => {
      try {
        const target = storePath();
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, JSON.stringify(store, null, 2), "utf8");
      } catch (err) {
        console.error("Demo store write failed:", err);
      }
    })
    .catch(() => undefined);

  await g.__movequoteDemoWriteQueue;
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
