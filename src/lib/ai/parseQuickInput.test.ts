import { describe, expect, it } from "vitest";
import { parseQuickInput } from "./generateQuoteCopy";

describe("parseQuickInput heuristics (no OpenAI)", () => {
  it("extracts full quote details from a Slovak voice transcript", async () => {
    // Force heuristic path by temporarily unsetting key is hard; parser
    // merges heuristic even with AI. Call with OPENAI unset.
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const text = `Meno zákazníka je Pavol Marek, telefónne číslo je 0915-365-819 Budeme robiť v rodinnom dome v Trenčíne, budeme meniť 4 plastové okna 1200x1400mm bude to trojsklo, farba bude biela a budeme demontovať aj tie staré okna a plus montáž aj tých nových okien Termín by mal byť približne 15.10.2026 a ešte tam budeme na konci montovať aj siete proti Hemizu`;

    const result = await parseQuickInput(text);
    process.env.OPENAI_API_KEY = prev;

    expect(result.customerFirstName).toBe("Pavol");
    expect(result.customerLastName).toBe("Marek");
    expect(result.customerPhone).toMatch(/0915/);
    expect(result.propertyType).toBe("rodinny_dom");
    expect(result.siteAddress?.toLowerCase()).toContain("trenčín");
    expect(result.category).toBe("plastove_okna");
    expect(result.count).toBe(4);
    expect(result.widthMm).toBe(1200);
    expect(result.heightMm).toBe(1400);
    expect(result.glazing).toBe("trojsklo");
    expect(result.color).toBe("biela");
    expect(result.montaz).toBe(true);
    expect(result.demontazStarych).toBe(true);
    expect(result.sieteProtiHmyzu).toBe(true);
    expect(result.installDate).toBe("2026-10-15");
  });
});
