import type { Quote } from "@/types/database";
import { propertyTypeLabel } from "@/lib/brand";
import { formatCurrency, formatDateSk } from "@/lib/utils";

/** Sanitized public DTO — never expose internal notes or cost formula details */
export type PublicQuoteDto = {
  publicId: string;
  customerName: string;
  customerFirstName: string | null;
  originAddress: string | null;
  destinationAddress: string | null;
  originPropertyType: string | null;
  originPropertyTypeLabel: string;
  originFloor: number | null;
  originElevator: boolean | null;
  destinationFloor: number | null;
  destinationElevator: boolean | null;
  distanceKm: number | null;
  boxCount: number | null;
  largeItems: string | null;
  wardrobesCount: number | null;
  bedsCount: number | null;
  sofasCount: number | null;
  appliancesCount: number | null;
  disassembly: boolean;
  assembly: boolean;
  packing: boolean;
  packingMaterial: boolean;
  disposal: boolean;
  heavyItems: boolean;
  protectiveWrapping: boolean;
  otherService: boolean;
  moveDate: string | null;
  moveDateLabel: string;
  estimatedHours: number | null;
  workers: number | null;
  vehicleType: string | null;
  customerNotes: string | null;
  aiIntro: string | null;
  aiSummary: string | null;
  aiScopeNote: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceRangeLabel: string;
  validUntil: string | null;
  validUntilLabel: string;
  company: {
    name: string;
    subtitle: string | null;
    address: string | null;
    ico: string | null;
    dic: string | null;
    icDph: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    logoUrl: string | null;
    primaryColor: string;
  };
};

export type CompanyPublicFields = {
  name: string;
  subtitle: string | null;
  address: string | null;
  ico: string | null;
  dic: string | null;
  ic_dph: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  primary_color: string;
};

export function toPublicQuoteDto(
  quote: Quote,
  company: CompanyPublicFields
): PublicQuoteDto {
  const priceMin = quote.price_min;
  const priceMax = quote.price_max;
  const priceRangeLabel =
    priceMin != null && priceMax != null
      ? `${formatCurrency(priceMin)} – ${formatCurrency(priceMax)}`
      : "—";

  return {
    publicId: quote.public_id,
    customerName: quote.customer_name,
    customerFirstName: quote.customer_first_name,
    originAddress: quote.origin_address,
    destinationAddress: quote.destination_address,
    originPropertyType: quote.origin_property_type,
    originPropertyTypeLabel: propertyTypeLabel(quote.origin_property_type),
    originFloor: quote.origin_floor,
    originElevator: quote.origin_elevator,
    destinationFloor: quote.destination_floor,
    destinationElevator: quote.destination_elevator,
    distanceKm: quote.distance_km,
    boxCount: quote.box_count,
    largeItems: quote.large_items,
    wardrobesCount: quote.wardrobes_count,
    bedsCount: quote.beds_count,
    sofasCount: quote.sofas_count,
    appliancesCount: quote.appliances_count,
    disassembly: quote.disassembly,
    assembly: quote.assembly,
    packing: quote.packing,
    packingMaterial: quote.packing_material,
    disposal: quote.disposal,
    heavyItems: quote.heavy_items,
    protectiveWrapping: quote.protective_wrapping,
    otherService: quote.other_service,
    moveDate: quote.move_date,
    moveDateLabel: formatDateSk(quote.move_date),
    estimatedHours: quote.estimated_hours,
    workers: quote.workers,
    vehicleType: quote.vehicle_type,
    customerNotes: quote.customer_notes,
    aiIntro: quote.ai_intro,
    aiSummary: quote.ai_summary,
    aiScopeNote: quote.ai_scope_note,
    priceMin,
    priceMax,
    priceRangeLabel,
    validUntil: quote.valid_until,
    validUntilLabel: formatDateSk(quote.valid_until),
    company: {
      name: company.name,
      subtitle: company.subtitle,
      address: company.address,
      ico: company.ico,
      dic: company.dic,
      icDph: company.ic_dph,
      email: company.email,
      phone: company.phone,
      website: company.website,
      logoUrl: company.logo_url,
      primaryColor: company.primary_color,
    },
  };
}
