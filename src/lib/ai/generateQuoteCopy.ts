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
    customerFirstName: null,
    customerLastName: null,
    customerPhone: null,
    customerEmail: null,
    category: null,
    widthMm: null,
    heightMm: null,
    count: null,
    color: null,
    glazing: null,
    montaz: null,
    demontazStarych: null,
    likvidacia: null,
    parapetVnutorny: null,
    parapetVonkajsi: null,
    sieteProtiHmyzu: null,
    otherService: null,
    lineItems: null,
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
          content: `Si extraktor údajov pre cenové ponuky firmy TOP Okno Trenčín (okná, dvere, tieniaca technika, garážové brány, siete proti hmyzu).

Úloha: zo slovenskej poznámky / hlasového prepisu vyťahni VŠETKY dostupné polia. Nevymýšľaj — chýbajúce daj null. Oprav typické chyby Whisperu (napr. „Hemizu/hemizu“ = hmyzu, „okna/okien“ = okná).

Pravidlá:
- customerFirstName / customerLastName: rozdeľ celé meno (napr. „Pavol Marek“ → Pavol / Marek). customerName = celé meno.
- customerPhone: normalizuj na formát 0XXX XXX XXX alebo 09XX XXX XXX (odstráň pomlčky, nechaj medzery podľa slovenskej konvencie).
- customerEmail: ak je v texte.
- siteAddress: mesto/ulica (napr. „Trenčín“).
- propertyType: byt | rodinny_dom | kancelaria | ine (rodinný dom → rodinny_dom).
- floor: číslo poschodia, inak null.
- installDate: YYYY-MM-DD (napr. 15.10.2026 → 2026-10-15). Ak je len deň.mesiac bez roku, použi aktuálny/nasledujúci logický rok.
- category: plastove_okna | plastove_dvere | hlinikove_systemy | interierove_dvere | tieniaca_technika | garazove_brany
- widthMm, heightMm, count, color, glazing (dvojsklo|trojsklo|ine) pre hlavnú položku.
- lineItems: pole položiek, ak ich je viac; inak môžeš dať jednu položku aj do category/widthMm/... a lineItems=null.
- montaz: true ak spomína montáž nových.
- demontazStarych: true ak demontáž / výmena starých okien.
- likvidacia: true ak likvidácia / odvoz starých.
- parapetVnutorny / parapetVonkajsi: true podľa textu.
- sieteProtiHmyzu: true pri sieťach proti hmyzu (aj preklepy Hemizu, hymzu, hmyz).
- otherService: true len pri iných prácach.
- notes: krátky súhrn alebo null (neopakuj celý text).

Vráť JEDEN JSON objekt s kľúčmi:
siteAddress, propertyType, floor, installDate, notes, customerName, customerFirstName, customerLastName, customerPhone, customerEmail, category, widthMm, heightMm, count, color, glazing, montaz, demontazStarych, likvidacia, parapetVnutorny, parapetVonkajsi, sieteProtiHmyzu, otherService, lineItems.`,
        },
        { role: "user", content: text },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return heuristicParse(text, empty);
    const json = JSON.parse(raw);
    const parsed = quickInputSchema.safeParse(normalizeParsedPayload(json));
    if (!parsed.success) {
      const heuristic = heuristicParse(text, empty);
      return mergeQuickParse(heuristic, softParse(json));
    }
    return mergeQuickParse(heuristicParse(text, empty), parsed.data);
  } catch {
    return heuristicParse(text, empty);
  }
}

function normalizeParsedPayload(raw: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...raw };
  for (const key of [
    "montaz",
    "demontazStarych",
    "likvidacia",
    "parapetVnutorny",
    "parapetVonkajsi",
    "sieteProtiHmyzu",
    "otherService",
  ]) {
    if (typeof out[key] === "string") {
      const v = String(out[key]).toLowerCase();
      out[key] = v === "true" || v === "ano" || v === "áno" || v === "1";
    }
  }
  for (const key of ["widthMm", "heightMm", "count", "floor"]) {
    if (typeof out[key] === "string" && out[key] !== "") {
      const n = Number(String(out[key]).replace(",", "."));
      out[key] = Number.isFinite(n) ? n : null;
    }
  }
  if (typeof out.installDate === "string") {
    out.installDate = normalizeSlovakDate(out.installDate) ?? out.installDate;
  }
  if (typeof out.customerPhone === "string") {
    out.customerPhone = normalizePhone(out.customerPhone);
  }
  return out;
}

function softParse(raw: Record<string, unknown>): Partial<QuickInputResult> {
  try {
    const normalized = normalizeParsedPayload(raw);
    const parsed = quickInputSchema.partial().safeParse(normalized);
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

function mergeQuickParse(
  base: QuickInputResult,
  overlay: Partial<QuickInputResult>
): QuickInputResult {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(overlay).filter(([, v]) => v !== null && v !== undefined)
    ),
  } as QuickInputResult;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  let local = digits;
  if (local.startsWith("+421")) local = `0${local.slice(4)}`;
  if (local.startsWith("421") && local.length >= 12) local = `0${local.slice(3)}`;
  if (/^09\d{8}$/.test(local)) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return raw.trim();
}

function normalizeSlovakDate(raw: string): string | null {
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;
  const sk = raw.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
  if (!sk) return null;
  const day = Number(sk[1]);
  const month = Number(sk[2]);
  let year = sk[3] ? Number(sk[3]) : new Date().getFullYear();
  if (year < 100) year += 2000;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function heuristicParse(text: string, empty: QuickInputResult): QuickInputResult {
  const lower = text.toLowerCase();
  const result = { ...empty };

  // Name: "Meno zákazníka je X" / "zákazník X" / "volá sa X"
  const nameMatch = text.match(
    /(?:meno\s+zákazníka\s+je|zákazník(?:a)?\s+(?:je\s+)?|volá\s+sa|meno[:\s]+)\s*([A-ZÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽ][a-záäčďéíľňóôŕšťúýž]+(?:\s+[A-ZÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽ][a-záäčďéíľňóôŕšťúýž]+)+)/i
  );
  if (nameMatch) {
    const full = nameMatch[1].trim();
    result.customerName = full;
    const parts = full.split(/\s+/);
    result.customerFirstName = parts[0] || null;
    result.customerLastName = parts.slice(1).join(" ") || null;
  }

  const phoneMatch = text.match(
    /(?:\+421|00421|0)\s*9\d{2}[\s./-]*\d{3}[\s./-]*\d{3}/
  );
  if (phoneMatch) {
    result.customerPhone = normalizePhone(phoneMatch[0]);
  }

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) result.customerEmail = emailMatch[0];

  if (/hlin[ií]k/.test(lower)) result.category = "hlinikove_systemy";
  else if (/gar[aá][zž]/.test(lower)) result.category = "garazove_brany";
  else if (/žal[uú]z|rolet|plisse|mark[ií]z|tieni/.test(lower))
    result.category = "tieniaca_technika";
  else if (/interi[eé]rov/.test(lower)) result.category = "interierove_dvere";
  else if (/dver/.test(lower) && !/okn/.test(lower))
    result.category = "plastove_dvere";
  else if (/okn/.test(lower)) result.category = "plastove_okna";

  if (/rodinn|v\s+dome|rodinnom\s+dome/.test(lower))
    result.propertyType = "rodinny_dom";
  else if (/byt/.test(lower)) result.propertyType = "byt";
  else if (/kancel/.test(lower)) result.propertyType = "kancelaria";

  const floorMatch = lower.match(/(\d+)\.?\s*poschod/);
  if (floorMatch) result.floor = Number(floorMatch[1]);

  const dimMatch = lower.match(/(\d{3,4})\s*[x×]\s*(\d{3,4})\s*(?:mm)?/);
  if (dimMatch) {
    result.widthMm = Number(dimMatch[1]);
    result.heightMm = Number(dimMatch[2]);
  }

  const countMatch =
    lower.match(/(\d+)\s*[x×]\s*(?:plastov[^ ]*\s+)?(?:okn|dver)/) ||
    lower.match(
      /(?:meni[tť]|vymeni[tť]|robi[tť]|da[tť])\s+(\d+)\s+(?:plastov[^ ]*\s+)?(?:okn|dver)/
    ) ||
    lower.match(/(\d+)\s+(?:ks\s+)?(?:plastov[^ ]*\s+)?okn/);
  if (countMatch) result.count = Number(countMatch[1]);

  if (/trojsklo/.test(lower)) result.glazing = "trojsklo";
  else if (/dvojsklo/.test(lower)) result.glazing = "dvojsklo";

  if (/biel/.test(lower)) result.color = "biela";
  else if (/antracit|antracitov/.test(lower)) result.color = "antracit";
  else if (/hned|orech|zlatý\s+dub|zlaty\s+dub/.test(lower)) result.color = "hnedá";

  if (/mont[aá][zž]/.test(lower)) result.montaz = true;
  if (/demont|star[eé]\s+okn|vymen/.test(lower)) result.demontazStarych = true;
  if (/likvid|odvoz\s+star/.test(lower)) result.likvidacia = true;
  if (/parapet.*vn[uú]tor|vn[uú]torn.*parapet/.test(lower))
    result.parapetVnutorny = true;
  if (/parapet.*vonkaj|vonkaj.*parapet/.test(lower)) result.parapetVonkajsi = true;
  if (/sie[tť].*hmyz|hmyz|hemiz|hymiz|proti\s+hem/.test(lower))
    result.sieteProtiHmyzu = true;

  const dateNearTerm =
    text.match(
      /term[ií]n[^0-9]{0,40}(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/i
    ) ||
    text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dateNearTerm) {
    result.installDate = normalizeSlovakDate(
      `${dateNearTerm[1]}.${dateNearTerm[2]}.${dateNearTerm[3] || new Date().getFullYear()}`
    );
  }

  const addrMatch = text.match(
    /(?:adresa|mont[aá][zž]\s+na|na adrese|v\s+(?:meste\s+)?)[:\s]+([^,.]+)/i
  );
  if (addrMatch) result.siteAddress = addrMatch[1].trim();
  const city = text.match(
    /(Trenčín|Bratislava|Žilina|Nitra|Trnava|Piešťany|Prievidza|Považská Bystrica)[^,]*/i
  );
  if (city) {
    result.siteAddress = result.siteAddress
      ? `${result.siteAddress}, ${city[0].trim()}`
      : city[0].trim();
    // Prefer clean city if address is just "rodinnom dome v Trenčíne" noise
    if (/rodinn|dome|byt/.test((result.siteAddress || "").toLowerCase())) {
      result.siteAddress = city[0].trim();
    }
  }

  return result;
}
