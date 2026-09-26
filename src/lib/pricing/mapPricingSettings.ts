import type { PricingSettings } from "@/types/database";
import {
  DEFAULT_PRICING,
  type PricingSettingsInput,
} from "@/lib/pricing/calculateQuoteEstimate";

export function mapPricingSettings(
  row: PricingSettings | null | undefined
): PricingSettingsInput {
  if (!row) return { ...DEFAULT_PRICING };

  return {
    pricePerM2PlastoveOkna: Number(row.price_per_m2_plastove_okna),
    pricePerM2PlastoveDvere: Number(row.price_per_m2_plastove_dvere),
    pricePerM2Hlinik: Number(row.price_per_m2_hlinik),
    pricePerM2InterieroveDvere: Number(row.price_per_m2_interierove_dvere),
    pricePerM2Tieniaca: Number(row.price_per_m2_tieniaca),
    pricePerM2GarazoveBrany: Number(row.price_per_m2_garazove_brany),
    fixedFee: Number(row.fixed_fee),
    montazPerM2: Number(row.montaz_per_m2),
    demontazPerUnit: Number(row.demontaz_per_unit),
    likvidaciaFee: Number(row.likvidacia_fee),
    parapetVnutornyFee: Number(row.parapet_vnutorny_fee),
    parapetVonkajsiFee: Number(row.parapet_vonkajsi_fee),
    sieteFee: Number(row.siete_fee),
    otherSurcharge: Number(row.other_surcharge),
    minimumJobPrice: Number(row.minimum_job_price),
    bufferMinMultiplier: Number(row.buffer_min_multiplier),
    bufferMaxMultiplier: Number(row.buffer_max_multiplier),
  };
}
