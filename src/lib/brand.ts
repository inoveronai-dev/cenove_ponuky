export const BRAND = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "MoveQuote",
  subtitle: "Inteligentné cenové ponuky pre sťahovacie firmy",
  heroTitle: "Jasný plán sťahovania a férová cena — bez prekvapení.",
} as const;

/** Demo / client company visual identity — TOP okno TN */
export const CLIENT_BRAND = {
  name: "TOP okno",
  legalName: "TOP okno TN",
  subtitle: "Profesionálne sťahovanie a logistika",
  primary: "#2E5894",
  primaryDark: "#1F3F6B",
  accent: "#00965E",
  accentDark: "#007A4C",
  ink: "#4A4A4A",
  logoPath: "/brand/top-okno-logo.png",
  email: "info@topokno.sk",
  phone: "+421 900 000 000",
  website: "https://topokno.sk",
  address: "Slovensko",
} as const;

export const PROPERTY_TYPES = [
  { value: "garsonka", label: "Garsónka" },
  { value: "1_izbovy", label: "1-izbový byt" },
  { value: "2_izbovy", label: "2-izbový byt" },
  { value: "3_izbovy", label: "3-izbový byt" },
  { value: "4_izbovy", label: "4-izbový byt" },
  { value: "rodinny_dom", label: "Rodinný dom" },
  { value: "kancelaria", label: "Kancelária" },
  { value: "sklad", label: "Sklad" },
  { value: "ine", label: "Iné" },
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];

export const VEHICLE_TYPES = [
  { value: "dodavka", label: "Dodávka" },
  { value: "velka_dodavka", label: "Veľká dodávka" },
  { value: "nakladne", label: "Nákladné vozidlo" },
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number]["value"];

export const QUOTE_STATUSES = {
  draft: "Koncept",
  ready: "Pripravená",
  sent: "Odoslaná",
  opened: "Otvorená",
} as const;

export type QuoteStatus = keyof typeof QUOTE_STATUSES;

export const ADDITIONAL_SERVICES = [
  { key: "disassembly", label: "Demontáž nábytku" },
  { key: "assembly", label: "Montáž nábytku" },
  { key: "packing", label: "Balenie vecí" },
  { key: "packing_material", label: "Baliaci materiál" },
  { key: "disposal", label: "Odvoz nepotrebného nábytku" },
  { key: "heavy_items", label: "Sťahovanie ťažkých predmetov" },
  { key: "protective_wrapping", label: "Ochranné balenie nábytku" },
  { key: "other", label: "Iné" },
] as const;

export function propertyTypeLabel(value: string | null | undefined): string {
  if (!value) return "";
  return PROPERTY_TYPES.find((p) => p.value === value)?.label ?? value;
}

export function vehicleTypeLabel(value: string | null | undefined): string {
  if (!value) return "";
  return VEHICLE_TYPES.find((v) => v.value === value)?.label ?? value;
}
