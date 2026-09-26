export const BRAND = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Cenové ponuky",
  subtitle: "Profesionálne cenové ponuky pre okná, dvere a tienenie",
  heroTitle: "Nové okná, dvere a tienenie — jasná cena a spoľahlivá montáž.",
} as const;

/** TOP Okno Trenčín — client company identity */
export const CLIENT_BRAND = {
  name: "TOP Okno",
  legalName: "TOP Okno Trenčín s.r.o.",
  shortName: "TOP Okno Trenčín",
  subtitle: "Okná, dvere a doplnky pre bývanie od roku 2013",
  primary: "#2E5894",
  primaryDark: "#1F3F6B",
  accent: "#00965E",
  accentDark: "#007A4C",
  ink: "#4A4A4A",
  logoPath: "/brand/top-okno-logo.png",
  email: "trencin@toptn.sk",
  phone: "0903 590 687",
  phoneSecondary: "0904 590 687",
  website: "https://toptn.sk",
  address: "Zlatovská 22, 911 05 Trenčín",
  ico: "46444254",
  icDph: "SK2820007058",
  hours: "PO–ŠT: 08:00 – 16:00",
} as const;

export const PROPERTY_TYPES = [
  { value: "byt", label: "Byt" },
  { value: "rodinny_dom", label: "Rodinný dom" },
  { value: "kancelaria", label: "Kancelária / prevádzka" },
  { value: "ine", label: "Iné" },
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];

export const PRODUCT_CATEGORIES = [
  { value: "plastove_okna", label: "Plastové okná" },
  { value: "plastove_dvere", label: "Plastové dvere / dverné výplne" },
  { value: "hlinikove_systemy", label: "Hliníkové systémy" },
  { value: "interierove_dvere", label: "Interiérové dvere" },
  { value: "tieniaca_technika", label: "Tieniaca technika" },
  { value: "garazove_brany", label: "Garážové brány" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["value"];

export const GLAZING_OPTIONS = [
  { value: "dvojsklo", label: "Dvojsklo" },
  { value: "trojsklo", label: "Trojsklo" },
  { value: "ine", label: "Iné / podľa dohody" },
] as const;

export const QUOTE_STATUSES = {
  draft: "Koncept",
  ready: "Pripravená",
  sent: "Odoslaná",
  opened: "Otvorená",
} as const;

export type QuoteStatus = keyof typeof QUOTE_STATUSES;

export const INSTALL_SERVICES = [
  { key: "montaz", label: "Montáž" },
  { key: "demontazStarych", label: "Demontáž starých okien/dverí" },
  { key: "likvidacia", label: "Likvidácia starých výplní" },
  { key: "parapetVnutorny", label: "Vnútorné parapety" },
  { key: "parapetVonkajsi", label: "Vonkajšie parapety" },
  { key: "sieteProtiHmyzu", label: "Siete proti hmyzu" },
  { key: "otherService", label: "Iné práce" },
] as const;

export function propertyTypeLabel(value: string | null | undefined): string {
  if (!value) return "";
  return PROPERTY_TYPES.find((p) => p.value === value)?.label ?? value;
}

export function productCategoryLabel(value: string | null | undefined): string {
  if (!value) return "";
  return PRODUCT_CATEGORIES.find((p) => p.value === value)?.label ?? value;
}

export function glazingLabel(value: string | null | undefined): string {
  if (!value) return "";
  return GLAZING_OPTIONS.find((g) => g.value === value)?.label ?? value;
}
