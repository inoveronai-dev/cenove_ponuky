import type { ProductCategory } from "@/lib/brand";

export type PricingSettingsInput = {
  pricePerM2PlastoveOkna: number;
  pricePerM2PlastoveDvere: number;
  pricePerM2Hlinik: number;
  pricePerM2InterieroveDvere: number;
  pricePerM2Tieniaca: number;
  pricePerM2GarazoveBrany: number;
  fixedFee: number;
  montazPerM2: number;
  demontazPerUnit: number;
  likvidaciaFee: number;
  parapetVnutornyFee: number;
  parapetVonkajsiFee: number;
  sieteFee: number;
  otherSurcharge: number;
  minimumJobPrice: number;
  bufferMinMultiplier: number;
  bufferMaxMultiplier: number;
};

export type QuoteLineItemInput = {
  category: ProductCategory | string;
  widthMm: number;
  heightMm: number;
  count: number;
};

export type QuoteEstimateInput = {
  items: QuoteLineItemInput[];
  montaz?: boolean;
  demontazStarych?: boolean;
  likvidacia?: boolean;
  parapetVnutorny?: boolean;
  parapetVonkajsi?: boolean;
  sieteProtiHmyzu?: boolean;
  otherService?: boolean;
};

export type QuoteEstimateResult = {
  productsCost: number;
  montazCost: number;
  extrasCost: number;
  fixedFee: number;
  totalAreaM2: number;
  totalUnits: number;
  baseEstimate: number;
  priceMin: number;
  priceMax: number;
};

export function roundToNearest10(value: number): number {
  return Math.round(value / 10) * 10;
}

export function areaM2(widthMm: number, heightMm: number, count: number): number {
  const w = Math.max(0, Number(widthMm) || 0) / 1000;
  const h = Math.max(0, Number(heightMm) || 0) / 1000;
  const n = Math.max(0, Number(count) || 0);
  return w * h * n;
}

function rateForCategory(
  category: string,
  pricing: PricingSettingsInput
): number {
  switch (category) {
    case "plastove_okna":
      return pricing.pricePerM2PlastoveOkna;
    case "plastove_dvere":
      return pricing.pricePerM2PlastoveDvere;
    case "hlinikove_systemy":
      return pricing.pricePerM2Hlinik;
    case "interierove_dvere":
      return pricing.pricePerM2InterieroveDvere;
    case "tieniaca_technika":
      return pricing.pricePerM2Tieniaca;
    case "garazove_brany":
      return pricing.pricePerM2GarazoveBrany;
    default:
      return pricing.pricePerM2PlastoveOkna;
  }
}

export function calculateQuoteEstimate(
  input: QuoteEstimateInput,
  pricing: PricingSettingsInput
): QuoteEstimateResult {
  const items = input.items || [];
  let productsCost = 0;
  let totalAreaM2 = 0;
  let totalUnits = 0;

  for (const item of items) {
    const area = areaM2(item.widthMm, item.heightMm, item.count);
    const units = Math.max(0, Number(item.count) || 0);
    totalAreaM2 += area;
    totalUnits += units;
    productsCost += area * rateForCategory(item.category, pricing);
  }

  const montazCost = input.montaz ? totalAreaM2 * pricing.montazPerM2 : 0;

  let extrasCost = 0;
  if (input.demontazStarych) extrasCost += totalUnits * pricing.demontazPerUnit;
  if (input.likvidacia) extrasCost += pricing.likvidaciaFee;
  if (input.parapetVnutorny) extrasCost += totalUnits * pricing.parapetVnutornyFee;
  if (input.parapetVonkajsi) extrasCost += totalUnits * pricing.parapetVonkajsiFee;
  if (input.sieteProtiHmyzu) extrasCost += totalUnits * pricing.sieteFee;
  if (input.otherService) extrasCost += pricing.otherSurcharge;

  const fixedFee = pricing.fixedFee;
  let baseEstimate = productsCost + montazCost + extrasCost + fixedFee;

  if (pricing.minimumJobPrice > 0 && baseEstimate < pricing.minimumJobPrice) {
    baseEstimate = pricing.minimumJobPrice;
  }

  const priceMin = roundToNearest10(baseEstimate * pricing.bufferMinMultiplier);
  const priceMax = roundToNearest10(baseEstimate * pricing.bufferMaxMultiplier);

  return {
    productsCost,
    montazCost,
    extrasCost,
    fixedFee,
    totalAreaM2: Math.round(totalAreaM2 * 100) / 100,
    totalUnits,
    baseEstimate,
    priceMin: Math.min(priceMin, priceMax),
    priceMax: Math.max(priceMin, priceMax),
  };
}

/** Orientational defaults (€/m² and fees) for demo — adjustable in settings */
export const DEFAULT_PRICING: PricingSettingsInput = {
  pricePerM2PlastoveOkna: 280,
  pricePerM2PlastoveDvere: 320,
  pricePerM2Hlinik: 420,
  pricePerM2InterieroveDvere: 180,
  pricePerM2Tieniaca: 120,
  pricePerM2GarazoveBrany: 200,
  fixedFee: 80,
  montazPerM2: 45,
  demontazPerUnit: 35,
  likvidaciaFee: 60,
  parapetVnutornyFee: 25,
  parapetVonkajsiFee: 35,
  sieteFee: 40,
  otherSurcharge: 0,
  minimumJobPrice: 0,
  bufferMinMultiplier: 0.92,
  bufferMaxMultiplier: 1.12,
};
