import type { PricingSettings } from "@/types/database";
import type { PricingSettingsInput } from "@/lib/pricing/calculateQuoteEstimate";

export function mapPricingSettings(
  row: PricingSettings | null | undefined
): PricingSettingsInput {
  if (!row) {
    return {
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
  }

  return {
    hourlyRatePerWorker: Number(row.hourly_rate_per_worker),
    kilometerRate: Number(row.kilometer_rate),
    routeMultiplier: Number(row.route_multiplier),
    fixedFee: Number(row.fixed_fee),
    disassemblySurcharge: Number(row.disassembly_surcharge),
    assemblySurcharge: Number(row.assembly_surcharge),
    packingSurcharge: Number(row.packing_surcharge),
    packingMaterialSurcharge: Number(row.packing_material_surcharge),
    heavyItemsSurcharge: Number(row.heavy_items_surcharge),
    disposalSurcharge: Number(row.disposal_surcharge),
    protectiveWrappingSurcharge: Number(row.protective_wrapping_surcharge),
    otherSurcharge: Number(row.other_surcharge),
    minimumJobPrice: Number(row.minimum_job_price),
    weekendSurchargePercent: Number(row.weekend_surcharge_percent),
    eveningSurchargePercent: Number(row.evening_surcharge_percent),
    bufferMinMultiplier: Number(row.buffer_min_multiplier),
    bufferMaxMultiplier: Number(row.buffer_max_multiplier),
  };
}
