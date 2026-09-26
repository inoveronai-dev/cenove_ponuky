import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICING,
  calculateQuoteEstimate,
  roundToNearest10,
} from "./calculateQuoteEstimate";

describe("roundToNearest10", () => {
  it("rounds to nearest 10", () => {
    expect(roundToNearest10(484)).toBe(480);
    expect(roundToNearest10(485)).toBe(490);
    expect(roundToNearest10(879.75 * 0.92)).toBe(810);
  });
});

describe("calculateQuoteEstimate", () => {
  it("calculates Ján Novák style quote in expected range", () => {
    const result = calculateQuoteEstimate(
      {
        estimatedHours: 6,
        workers: 3,
        distanceKm: 55,
        disassembly: true,
      },
      DEFAULT_PRICING
    );

    // labor 6*3*38 = 684, transport 55*0.65 = 35.75, extras 70, fixed 90
    expect(result.laborCost).toBe(684);
    expect(result.transportCost).toBeCloseTo(35.75);
    expect(result.extrasCost).toBe(70);
    expect(result.baseEstimate).toBeCloseTo(879.75);
    expect(result.priceMin).toBe(810);
    expect(result.priceMax).toBe(990);
  });

  it("handles zero distance", () => {
    const result = calculateQuoteEstimate(
      { estimatedHours: 2, workers: 2, distanceKm: 0 },
      DEFAULT_PRICING
    );
    expect(result.transportCost).toBe(0);
    expect(result.laborCost).toBe(152);
  });

  it("sums only selected extras", () => {
    const result = calculateQuoteEstimate(
      {
        estimatedHours: 0,
        workers: 0,
        distanceKm: 0,
        packing: true,
        packingMaterial: true,
      },
      DEFAULT_PRICING
    );
    expect(result.extrasCost).toBe(120);
    expect(result.baseEstimate).toBe(210);
  });

  it("enforces minimum job price before buffers", () => {
    const result = calculateQuoteEstimate(
      { estimatedHours: 1, workers: 1, distanceKm: 0 },
      { ...DEFAULT_PRICING, fixedFee: 0, minimumJobPrice: 500 }
    );
    expect(result.baseEstimate).toBe(500);
    expect(result.priceMin).toBe(460);
    expect(result.priceMax).toBe(560);
  });

  it("applies weekend surcharge percent", () => {
    const result = calculateQuoteEstimate(
      {
        estimatedHours: 2,
        workers: 2,
        distanceKm: 0,
        isWeekend: true,
      },
      { ...DEFAULT_PRICING, weekendSurchargePercent: 10, fixedFee: 0 }
    );
    // labor 152, weekend 15.2
    expect(result.weekendSurcharge).toBeCloseTo(15.2);
    expect(result.baseEstimate).toBeCloseTo(167.2);
  });
});
