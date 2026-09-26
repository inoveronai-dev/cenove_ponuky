import type { Quote, QuoteLineItem } from "@/types/database";
import {
  glazingLabel,
  productCategoryLabel,
  propertyTypeLabel,
} from "@/lib/brand";
import { formatCurrency, formatDateSk } from "@/lib/utils";

/** Sanitized public DTO — never expose internal notes or cost formula details */
export type PublicQuoteDto = {
  publicId: string;
  customerName: string;
  customerFirstName: string | null;
  siteAddress: string | null;
  propertyType: string | null;
  propertyTypeLabel: string;
  floor: number | null;
  lineItems: {
    category: string;
    categoryLabel: string;
    widthMm: number;
    heightMm: number;
    count: number;
    color: string | null;
    glazing: string | null;
    glazingLabel: string;
    notes: string | null;
    sizeLabel: string;
  }[];
  montaz: boolean;
  demontazStarych: boolean;
  likvidacia: boolean;
  parapetVnutorny: boolean;
  parapetVonkajsi: boolean;
  sieteProtiHmyzu: boolean;
  otherService: boolean;
  installDate: string | null;
  installDateLabel: string;
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

function mapLineItems(items: QuoteLineItem[] | null | undefined) {
  return (items || []).map((item) => ({
    category: item.category,
    categoryLabel: productCategoryLabel(item.category),
    widthMm: item.widthMm,
    heightMm: item.heightMm,
    count: item.count,
    color: item.color || null,
    glazing: item.glazing || null,
    glazingLabel: glazingLabel(item.glazing),
    notes: item.notes || null,
    sizeLabel: `${item.widthMm} × ${item.heightMm} mm`,
  }));
}

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
    siteAddress: quote.site_address,
    propertyType: quote.property_type,
    propertyTypeLabel: propertyTypeLabel(quote.property_type),
    floor: quote.floor,
    lineItems: mapLineItems(quote.line_items),
    montaz: quote.montaz,
    demontazStarych: quote.demontaz_starych,
    likvidacia: quote.likvidacia,
    parapetVnutorny: quote.parapet_vnutorny,
    parapetVonkajsi: quote.parapet_vonkajsi,
    sieteProtiHmyzu: quote.siete_proti_hmyzu,
    otherService: quote.other_service,
    installDate: quote.install_date,
    installDateLabel: formatDateSk(quote.install_date),
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
