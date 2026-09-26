import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICING,
  calculateQuoteEstimate,
  areaM2,
} from "./calculateQuoteEstimate";

describe("calculateQuoteEstimate (okná)", () => {
  it("computes area from mm dimensions", () => {
    expect(areaM2(1200, 1400, 2)).toBeCloseTo(3.36, 2);
  });

  it("calculates a typical plastic windows quote", () => {
    const result = calculateQuoteEstimate(
      {
        items: [
          {
            category: "plastove_okna",
            widthMm: 1200,
            heightMm: 1400,
            count: 4,
          },
          {
            category: "plastove_dvere",
            widthMm: 900,
            heightMm: 2100,
            count: 1,
          },
        ],
        montaz: true,
        demontazStarych: true,
        likvidacia: true,
        parapetVnutorny: true,
      },
      DEFAULT_PRICING
    );

    expect(result.totalUnits).toBe(5);
    expect(result.totalAreaM2).toBeGreaterThan(6);
    expect(result.productsCost).toBeGreaterThan(0);
    expect(result.montazCost).toBeGreaterThan(0);
    expect(result.priceMin).toBeLessThanOrEqual(result.priceMax);
    expect(result.baseEstimate).toBeGreaterThan(1500);
  });

  it("returns zero products when no items", () => {
    const result = calculateQuoteEstimate({ items: [] }, DEFAULT_PRICING);
    expect(result.productsCost).toBe(0);
    expect(result.baseEstimate).toBe(DEFAULT_PRICING.fixedFee);
  });
});
