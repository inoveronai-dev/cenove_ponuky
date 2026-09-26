import OpenAI from "openai";
import { z } from "zod";
import {
  glazingLabel,
  productCategoryLabel,
  propertyTypeLabel,
} from "@/lib/brand";
import { quickInputSchema, type QuickInputResult } from "@/lib/quotes/schemas";
import type { QuoteLineItem } from "@/types/database";

export type QuoteCopyInput = {
  customerName: string;
  customerFirstName?: string | null;
  siteAddress?: string | null;
  propertyType?: string | null;
  floor?: number | null;
  lineItems?: QuoteLineItem[];
  montaz?: boolean;
  demontazStarych?: boolean;
  likvidacia?: boolean;
  parapetVnutorny?: boolean;
  parapetVonkajsi?: boolean;
  sieteProtiHmyzu?: boolean;
  installDate?: string | null;
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

function summarizeItems(items: QuoteLineItem[] | undefined): string {
  if (!items?.length) return "položky podľa dohodnutého rozsahu";
  return items
    .map((item) => {
      const cat = productCategoryLabel(item.category);
      const size = `${item.widthMm}×${item.heightMm} mm`;
      const color = item.color ? `, ${item.color}` : "";
      const glass = item.glazing ? `, ${glazingLabel(item.glazing)}` : "";
      return `${item.count}× ${cat} (${size}${color}${glass})`;
    })
    .join("; ");
}

export function buildFallbackCopy(input: QuoteCopyInput): QuoteCopyResult {
  const name = politeName(input);
  const property = propertyTypeLabel(input.propertyType);
  const site = input.siteAddress || "uvedenej adrese";
  const itemsText = summarizeItems(input.lineItems);
  const extras: string[] = [];
  if (input.montaz) extras.push("montáž");
  if (input.demontazStarych) extras.push("demontáž starých výplní");
  if (input.likvidacia) extras.push("likvidáciu");
  if (input.parapetVnutorny) extras.push("vnútorné parapety");
  if (input.parapetVonkajsi) extras.push("vonkajšie parapety");
  if (input.sieteProtiHmyzu) extras.push("siete proti hmyzu");
  const extrasText =
    extras.length > 0
      ? ` Súčasťou ponuky je aj ${extras.join(", ")}.`
      : "";
  const propertyPart = property ? `${property} ` : "";
  const floorPart =
    input.floor != null ? ` (${input.floor}. poschodie)` : "";

  return {
    aiIntro: `Dobrý deň, ${name},\n\nna základe informácií, ktoré ste nám poskytli, sme pre vás pripravili orientačný cenový odhad dodávky a montáže okien, dverí a súvisiacich produktov. Cieľom je, aby ste ešte pred realizáciou mali jasnú predstavu o rozsahu aj približnej cene.`,
    aiSummary: `Počítame s realizáciou na adrese ${site}${floorPart} — ${propertyPart}objekt. V ponuke: ${itemsText}.${extrasText}`,
    aiScopeNote:
      "Cena vychádza z uvedených rozmerov a rozsahu. Presná suma závisí od zamerania na mieste, typu profilu, zasklenia, farby a prístupnosti objektu.",
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
          content: `Si copywriter pre slovenskú firmu TOP Okno Trenčín (okná, dvere, tieniaca technika, garážové brány). Píšeš profesionálne, ľudsky a stručne. Bez emoji, bez marketingových fráz, bez vymyslených údajov. Odpovedz JSON: {"aiIntro":"...","aiSummary":"...","aiScopeNote":"..."}. Jazyk: slovenčina.`,
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
    siteAddress: null,
    propertyType: null,
    floor: null,
    installDate: null,
    notes: null,
    customerName: null,
    category: null,
    widthMm: null,
    heightMm: null,
    count: null,
    color: null,
    glazing: null,
    montaz: null,
    demontazStarych: null,
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
          content: `Extrahuj údaje o cenovej ponuke na okná/dvere/tienenie zo slovenskej poznámky. Nevymýšľaj hodnoty — chýbajúce daj null.
propertyType: byt, rodinny_dom, kancelaria, ine.
category: plastove_okna, plastove_dvere, hlinikove_systemy, interierove_dvere, tieniaca_technika, garazove_brany.
glazing: dvojsklo, trojsklo, ine.
installDate vo formáte YYYY-MM-DD ak vieš.
Vráť JSON: siteAddress, propertyType, floor, installDate, notes, customerName, category, widthMm, heightMm, count, color, glazing, montaz, demontazStarych.`,
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

  if (/hlin[ií]k/.test(lower)) result.category = "hlinikove_systemy";
  else if (/gar[aá][zž]/.test(lower)) result.category = "garazove_brany";
  else if (/žal[uú]z|rolet|plisse|mark[ií]z|tieni/.test(lower))
    result.category = "tieniaca_technika";
  else if (/interi[eé]rov/.test(lower)) result.category = "interierove_dvere";
  else if (/dver/.test(lower)) result.category = "plastove_dvere";
  else if (/okn/.test(lower)) result.category = "plastove_okna";

  if (/rodinn|dom/.test(lower)) result.propertyType = "rodinny_dom";
  else if (/byt/.test(lower)) result.propertyType = "byt";
  else if (/kancel/.test(lower)) result.propertyType = "kancelaria";

  const floorMatch = lower.match(/(\d+)\.?\s*poschod/);
  if (floorMatch) result.floor = Number(floorMatch[1]);

  const dimMatch = lower.match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/);
  if (dimMatch) {
    result.widthMm = Number(dimMatch[1]);
    result.heightMm = Number(dimMatch[2]);
  }

  const countMatch = lower.match(/(\d+)\s*[x×]\s*(?:okn|dver|ks)/);
  if (countMatch) result.count = Number(countMatch[1]);
  else {
    const ks = lower.match(/(\d+)\s*ks/);
    if (ks) result.count = Number(ks[1]);
  }

  if (/trojsklo/.test(lower)) result.glazing = "trojsklo";
  else if (/dvojsklo/.test(lower)) result.glazing = "dvojsklo";

  if (/mont[aá][zž]/.test(lower) && !/demont/.test(lower)) result.montaz = true;
  if (/demont/.test(lower)) result.demontazStarych = true;

  const addrMatch = text.match(
    /(?:adresa|mont[aá][zž]\s+na|na adrese)[:\s]+([^,.]+)/i
  );
  if (addrMatch) result.siteAddress = addrMatch[1].trim();
  else if (/tren[cč][ií]n|bratislava|žilina|nitra|trnave?/i.test(text)) {
    const city = text.match(
      /(Trenčín|Bratislava|Žilina|Nitra|Trnava|Piešťany)[^,]*/i
    );
    if (city) result.siteAddress = city[0].trim();
  }

  result.notes = text.trim();
  return result;
}
