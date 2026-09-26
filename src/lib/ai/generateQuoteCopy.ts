import OpenAI from "openai";
import { z } from "zod";
import { propertyTypeLabel } from "@/lib/brand";
import { quickInputSchema, type QuickInputResult } from "@/lib/quotes/schemas";

export type QuoteCopyInput = {
  customerName: string;
  customerFirstName?: string | null;
  originAddress?: string | null;
  destinationAddress?: string | null;
  originPropertyType?: string | null;
  boxCount?: number | null;
  largeItems?: string | null;
  disassembly?: boolean;
  assembly?: boolean;
  packing?: boolean;
  moveDate?: string | null;
  customerNotes?: string | null;
};

export type QuoteCopyResult = {
  aiIntro: string;
  aiSummary: string;
  aiScopeNote: string;
  source: "openai" | "fallback";
};

const copySchema = z.object({
  aiIntro: z.string(),
  aiSummary: z.string(),
  aiScopeNote: z.string(),
});

function politeName(input: QuoteCopyInput): string {
  const first = input.customerFirstName?.trim();
  if (first) {
    const last = input.customerName.replace(first, "").trim();
    if (last) return `pán/pani ${last}`;
    return first;
  }
  return input.customerName;
}

export function buildFallbackCopy(input: QuoteCopyInput): QuoteCopyResult {
  const name = politeName(input);
  const property = propertyTypeLabel(input.originPropertyType);
  const origin = input.originAddress || "východiskovej adresy";
  const destination = input.destinationAddress || "cieľovej adresy";
  const boxes =
    input.boxCount != null
      ? `približne ${input.boxCount} krabíc`
      : "veci podľa dohodnutého rozsahu";
  const items = input.largeItems?.trim()
    ? `, ${input.largeItems.trim()}`
    : "";
  const extras: string[] = [];
  if (input.disassembly) extras.push("demontáž vybraného nábytku");
  if (input.assembly) extras.push("montáž nábytku");
  if (input.packing) extras.push("balenie vecí");
  const extrasText =
    extras.length > 0 ? ` Súčasťou realizácie bude aj ${extras.join(", ")}.` : "";

  const propertyPart = property ? `${property} ` : "";

  return {
    aiIntro: `Dobrý deň, ${name},\n\nna základe informácií, ktoré ste nám poskytli, sme pre vás pripravili orientačný cenový odhad sťahovania. Cieľom je, aby ste ešte pred realizáciou mali jasnú predstavu o rozsahu služby aj približnej cene.`,
    aiSummary: `Počítame so sťahovaním ${propertyPart}z ${origin} do ${destination}. Ide o ${boxes}${items}.${extrasText}`,
    aiScopeNote:
      "Cena vychádza z informácií uvedených vyššie. Presná suma závisí od skutočného objemu vecí, prístupnosti oboch adries a reálneho času realizácie.",
    source: "fallback",
  };
}

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export async function generateQuoteCopy(
  input: QuoteCopyInput
): Promise<QuoteCopyResult> {
  const fallback = buildFallbackCopy(input);
  const client = getOpenAI();
  if (!client) return fallback;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Si copywriter pre slovenskú sťahovaciu firmu. Píšeš profesionálne, ľudsky, teplo a stručne. Bez emoji, bez marketingových fráz, bez vymyslených údajov. Odpovedz JSON: {"aiIntro":"...","aiSummary":"...","aiScopeNote":"..."}. Jazyk: slovenčina.`,
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallback;
    const parsed = copySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return fallback;
    return { ...parsed.data, source: "openai" };
  } catch {
    return fallback;
  }
}

export async function parseQuickInput(text: string): Promise<QuickInputResult> {
  const empty: QuickInputResult = {
    originAddress: null,
    destinationAddress: null,
    propertyType: null,
    floor: null,
    elevator: null,
    boxCount: null,
    largeItems: null,
    disassembly: null,
    assembly: null,
    packing: null,
    moveDate: null,
    notes: null,
    estimatedHours: null,
    workers: null,
    distanceKm: null,
    customerName: null,
  };

  const client = getOpenAI();
  if (!client) {
    return heuristicParse(text, empty);
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Extrahuj údaje o sťahovaní zo slovenskej poznámky. Nevymýšľaj hodnoty — chýbajúce daj null.
propertyType musí byť jeden z: garsonka, 1_izbovy, 2_izbovy, 3_izbovy, 4_izbovy, rodinny_dom, kancelaria, sklad, ine.
moveDate vo formáte YYYY-MM-DD ak vieš, inak null.
Vráť JSON s kľúčmi: originAddress, destinationAddress, propertyType, floor, elevator, boxCount, largeItems, disassembly, assembly, packing, moveDate, notes, estimatedHours, workers, distanceKm, customerName.`,
        },
        { role: "user", content: text },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return heuristicParse(text, empty);
    const parsed = quickInputSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return heuristicParse(text, empty);
    return parsed.data;
  } catch {
    return heuristicParse(text, empty);
  }
}

function heuristicParse(text: string, empty: QuickInputResult): QuickInputResult {
  const lower = text.toLowerCase();
  const result = { ...empty };

  const boxMatch = lower.match(/(\d+)\s*krab/);
  if (boxMatch) result.boxCount = Number(boxMatch[1]);

  if (/3[\s-]?izb/.test(lower)) result.propertyType = "3_izbovy";
  else if (/2[\s-]?izb/.test(lower)) result.propertyType = "2_izbovy";
  else if (/1[\s-]?izb/.test(lower)) result.propertyType = "1_izbovy";
  else if (/gars[oó]n/.test(lower)) result.propertyType = "garsonka";
  else if (/dom/.test(lower)) result.propertyType = "rodinny_dom";

  const floorMatch = lower.match(/(\d+)\.?\s*poschod/);
  if (floorMatch) result.floor = Number(floorMatch[1]);

  if (/výťah|vytah/.test(lower)) {
    result.elevator = !/bez výťahu|bez vytahu|výťah nie|vytah nie/.test(lower);
  }

  if (/demont|rozobrať|rozobrat/.test(lower)) result.disassembly = true;
  if (/montáž|montaz/.test(lower) && !/demont/.test(lower)) result.assembly = true;
  if (/balen/.test(lower)) result.packing = true;

  const routeMatch = text.match(/(.+?)\s+(?:do|→|->)\s+(.+?)(?:,|\.|$)/i);
  if (routeMatch) {
    result.originAddress = routeMatch[1].replace(/^\d+\s*izb[^\s]*\s*/i, "").trim();
    result.destinationAddress = routeMatch[2].trim();
  }

  const items: string[] = [];
  if (/sedač|gauč|gauc/.test(lower)) items.push("sedačka");
  if (/poste[ľl]/.test(lower)) items.push("posteľ");
  if (/práč|prac/.test(lower)) items.push("práčka");
  if (/skrin/.test(lower)) {
    const m = lower.match(/(\d+)\s*skrin/);
    items.push(m ? `${m[1]} skrine` : "skrine");
  }
  if (items.length) result.largeItems = items.join(", ");

  result.notes = text.trim();
  return result;
}
