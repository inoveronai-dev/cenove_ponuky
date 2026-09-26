export type PricingSettingsInput = {
  hourlyRatePerWorker: number;
  kilometerRate: number;
  routeMultiplier: number;
  fixedFee: number;
  disassemblySurcharge: number;
  assemblySurcharge: number;
  packingSurcharge: number;
  packingMaterialSurcharge: number;
  heavyItemsSurcharge: number;
  disposalSurcharge: number;
  protectiveWrappingSurcharge: number;
  otherSurcharge: number;
  minimumJobPrice: number;
  weekendSurchargePercent: number;
  eveningSurchargePercent: number;
  bufferMinMultiplier: number;
  bufferMaxMultiplier: number;
};

export type QuoteEstimateInput = {
  estimatedHours: number;
  workers: number;
  distanceKm: number;
  disassembly?: boolean;
  assembly?: boolean;
  packing?: boolean;
  packingMaterial?: boolean;
  heavyItems?: boolean;
  disposal?: boolean;
  protectiveWrapping?: boolean;
  otherService?: boolean;
  isWeekend?: boolean;
  isEvening?: boolean;
};

export type QuoteEstimateResult = {
  laborCost: number;
  transportCost: number;
  extrasCost: number;
  fixedFee: number;
  subtotalBeforeSurcharges: number;
  weekendSurcharge: number;
  eveningSurcharge: number;
  baseEstimate: number;
  priceMin: number;
  priceMax: number;
};

export function roundToNearest10(value: number): number {
  return Math.round(value / 10) * 10;
}

export function calculateQuoteEstimate(
  input: QuoteEstimateInput,
  pricing: PricingSettingsInput
): QuoteEstimateResult {
  const hours = Math.max(0, Number(input.estimatedHours) || 0);
  const workers = Math.max(0, Number(input.workers) || 0);
  const distance = Math.max(0, Number(input.distanceKm) || 0);
  const routeMultiplier = pricing.routeMultiplier > 0 ? pricing.routeMultiplier : 1;

  const laborCost = hours * workers * pricing.hourlyRatePerWorker;
  const transportCost = distance * routeMultiplier * pricing.kilometerRate;

  let extrasCost = 0;
  if (input.disassembly) extrasCost += pricing.disassemblySurcharge;
  if (input.assembly) extrasCost += pricing.assemblySurcharge;
  if (input.packing) extrasCost += pricing.packingSurcharge;
  if (input.packingMaterial) extrasCost += pricing.packingMaterialSurcharge;
  if (input.heavyItems) extrasCost += pricing.heavyItemsSurcharge;
  if (input.disposal) extrasCost += pricing.disposalSurcharge;
  if (input.protectiveWrapping) extrasCost += pricing.protectiveWrappingSurcharge;
  if (input.otherService) extrasCost += pricing.otherSurcharge;

  const fixedFee = pricing.fixedFee;
  const subtotalBeforeSurcharges = laborCost + transportCost + extrasCost + fixedFee;

  const weekendSurcharge = input.isWeekend
    ? subtotalBeforeSurcharges * (pricing.weekendSurchargePercent / 100)
    : 0;
  const eveningSurcharge = input.isEvening
    ? subtotalBeforeSurcharges * (pricing.eveningSurchargePercent / 100)
    : 0;

  let baseEstimate = subtotalBeforeSurcharges + weekendSurcharge + eveningSurcharge;

  if (pricing.minimumJobPrice > 0 && baseEstimate < pricing.minimumJobPrice) {
    baseEstimate = pricing.minimumJobPrice;
  }

  const priceMin = roundToNearest10(baseEstimate * pricing.bufferMinMultiplier);
  const priceMax = roundToNearest10(baseEstimate * pricing.bufferMaxMultiplier);

  return {
    laborCost,
    transportCost,
    extrasCost,
    fixedFee,
    subtotalBeforeSurcharges,
    weekendSurcharge,
    eveningSurcharge,
    baseEstimate,
    priceMin: Math.min(priceMin, priceMax),
    priceMax: Math.max(priceMin, priceMax),
  };
}

export const DEFAULT_PRICING: PricingSettingsInput = {
  hourlyRatePerWorker: 38,
  kilometerRate: 0.65,
  routeMultiplier: 1,
  fixedFee: 90,
  disassemblySurcharge: 70,
  assemblySurcharge: 70,
  packingSurcharge: 80,
  packingMaterialSurcharge: 40,
  heavyItemsSurcharge: 60,
  disposalSurcharge: 50,
  protectiveWrappingSurcharge: 45,
  otherSurcharge: 0,
  minimumJobPrice: 0,
  weekendSurchargePercent: 0,
  eveningSurchargePercent: 0,
  bufferMinMultiplier: 0.92,
  bufferMaxMultiplier: 1.12,
};
