import { describe, expect, it } from "vitest";
import { parseQuickInput } from "./generateQuoteCopy";

async function withHeuristicOnly<T>(fn: () => Promise<T>): Promise<T> {
  const prev = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prev;
  }
}

describe("parseQuickInput heuristics (no OpenAI)", () => {
  it("extracts full quote details from a Slovak voice transcript", async () => {
    const text = `Meno zákazníka je Pavol Marek, telefónne číslo je 0915-365-819 Budeme robiť v rodinnom dome v Trenčíne, budeme meniť 4 plastové okna 1200x1400mm bude to trojsklo, farba bude biela a budeme demontovať aj tie staré okna a plus montáž aj tých nových okien Termín by mal byť približne 15.10.2026 a ešte tam budeme na konci montovať aj siete proti Hemizu`;

    const result = await withHeuristicOnly(() => parseQuickInput(text));

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

  it("keeps street + number for Trenčín na štefánikovej 7", async () => {
    const result = await withHeuristicOnly(() =>
      parseQuickInput("Rodinný dom Trenčín na štefánikovej 7, 3 plastové okná")
    );
    expect(result.siteAddress?.toLowerCase()).toContain("štefánikova");
    expect(result.siteAddress).toMatch(/7/);
    expect(result.siteAddress?.toLowerCase()).toContain("trenčín");
  });

  it("parses Martin Horváth Whisper-style transcript cleanly", async () => {
    const text = `Meno zákazníka je Martin Horváth, telefón 0905 381691 Adresa a ulica je Vysoká 5 v Trenčíne Typ objektu je rodinný dom Prepokladaný datum montáže je 29.09.2026 Položky nejakej ponuky budú Plastové kná Zo šírkou 1200-1800 mm Početku sú bude 9 Farba modrá Za sklenie môže byť dvojsklo K tomu sa budú ešte montovať siete proti hmyzu`;

    const result = await withHeuristicOnly(() => parseQuickInput(text));

    expect(result.customerFirstName).toBe("Martin");
    expect(result.customerLastName).toBe("Horváth");
    expect(result.customerPhone).toMatch(/0905/);
    expect(result.siteAddress).toMatch(/Vysoká\s+5/i);
    expect(result.siteAddress?.toLowerCase()).toContain("trenčín");
    expect(result.siteAddress?.toLowerCase()).not.toMatch(
      /typ objektu|prepoklad|plastov/
    );
    expect(result.propertyType).toBe("rodinny_dom");
    expect(result.installDate).toBe("2026-09-29");
    expect(result.category).toBe("plastove_okna");
    expect(result.widthMm).toBe(1200);
    expect(result.heightMm).toBe(1800);
    expect(result.count).toBe(9);
    expect(result.color).toBe("modrá");
    expect(result.glazing).toBe("dvojsklo");
    expect(result.sieteProtiHmyzu).toBe(true);
    expect(result.montaz).toBe(true);
  });
});
