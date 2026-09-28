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
  const floorPart =
    input.floor != null ? ` (${input.floor}. poschodie)` : "";

  return {
    aiIntro: `Dobrý deň, ${name},\n\nďakujeme za dopyt. Pripravili sme pre vás prehľadnú cenovú ponuku dodávky a montáže — s dôrazom na kvalitu, úsporu energie a spoľahlivú realizáciu od TOP Okno Trenčín.`,
    aiSummary: `Realizácia: ${site}${floorPart}${property ? ` (${property})` : ""}. Rozsah: ${itemsText}.${extrasText} Všetko podľa vami uvedených parametrov.`,
    aiScopeNote:
      "Orientačná cena vychádza výhradne z údajov v tejto ponuke (rozmery, počet, služby). Po zameraní na mieste ju vieme potvrdiť alebo upraviť — bez skrytých položiek.",
    source: "fallback",
  };
}

/** Primary model for filling quote fields + writing offer copy */
const OPENAI_MODEL = "gpt-5.4";

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
      model: OPENAI_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Si copywriter pre slovenskú firmu TOP Okno Trenčín (okná, dvere, tieniaca technika, garážové brány).

Napíš predajne príjemný, dôveryhodný text v slovenčine. Lákať môžeš kvalitou, komfortom, úsporou a odbornou montážou — ALE:
- Použi VÝHRADNE údaje z JSON vstupu (meno, adresa, rozmery, počet, farba, zasklenie, služby, termín).
- NIKDY nevymýšľaj iné rozmery, počty, adresy, produkty ani ceny.
- Ak niečo vo vstupe chýba, nespomínaj to.
- Bez emoji, bez klamstiev, bez fiktívnych akcií/zliav.

Odpovedz JSON: {"aiIntro":"...","aiSummary":"...","aiScopeNote":"..."}.`,
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

  const cleaned = preprocessTranscript(text);
  const heuristic = heuristicParse(cleaned, empty);

  const client = getOpenAI();
  if (!client) return heuristic;

  try {
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Si asistent TOP Okno Trenčín. Tvoja úloha NIE JE len „prepis“ — máš SPRÁVNE DOPLNIŤ VŠETKY polia cenovej ponuky z poznámky / Whisper prepisu, aby sa formulár vyplnil naraz.

Cieľ: kompletné, čisté hodnoty pripravené na uloženie do formulára (zákazník, adresa, objekt, termín, položka okien/dverí, farba, zasklenie, služby). Nevymýšľaj. Chýbajúce = null.

Oprav Whisper: kná→okná, Hemizu→hmyzu, Prepokladaný→Predpokladaný, Početku→Počet, Za sklenie→Zasklenie.
Rozmery: „1200-1800 mm“ / „šírkou 1200-1800“ pri oknách = widthMm 1200, heightMm 1800 (nie naopak, nie iné čísla).

KRITICKÉ pri dopĺňaní:
- customerFirstName + customerLastName + customerName + customerPhone (09XX XXX XXX)
- siteAddress = KRÁTKA adresa, napr. „Vysoká 5, Trenčín“. NIKDY celá veta, NIKDY „Adresa a ulica je“, „Typ objektu“, „Predpokladaný dátum“, položky ponuky.
- propertyType: byt|rodinny_dom|kancelaria|ine
- installDate: YYYY-MM-DD (29.09.2026 → 2026-09-29), celý dátum
- category: plastove_okna|plastove_dvere|hlinikove_systemy|interierove_dvere|tieniaca_technika|garazove_brany
- widthMm, heightMm, count, color (slovensky: modrá, biela…), glazing: dvojsklo|trojsklo|ine
- montaz / demontazStarych / likvidacia / parapetVnutorny / parapetVonkajsi / sieteProtiHmyzu podľa textu
- lineItems: ak je jedna hlavná položka, môžeš ju dať aj do category/widthMm/… a lineItems=null

Vráť JSON:
siteAddress, propertyType, floor, installDate, notes, customerName, customerFirstName, customerLastName, customerPhone, customerEmail, category, widthMm, heightMm, count, color, glazing, montaz, demontazStarych, likvidacia, parapetVnutorny, parapetVonkajsi, sieteProtiHmyzu, otherService, lineItems.`,
        },
        { role: "user", content: cleaned },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return heuristic;
    const json = JSON.parse(raw);
    const parsed = quickInputSchema.safeParse(normalizeParsedPayload(json));
    const ai = parsed.success ? parsed.data : softParse(json);
    return smartMerge(heuristic, ai);
  } catch {
    return heuristic;
  }
}

function preprocessTranscript(text: string): string {
  return text
    .replace(/\bplastové\s+kná\b/gi, "plastové okná")
    .replace(/\bkná\b/gi, "okná")
    .replace(/\bHemizu\b/gi, "hmyzu")
    .replace(/\bhemizu\b/gi, "hmyzu")
    .replace(/\bPrepokladaný\b/gi, "Predpokladaný")
    .replace(/\bPočetku\b/gi, "Počet")
    .replace(/\bZa\s+sklenie\b/gi, "Zasklenie")
    .replace(
      /(šírk\w*|okn\w*|rozmer\w*)([^\d]{0,30})(\d{3,4})\s*[-–]\s*(\d{3,4})(\s*mm)?/gi,
      "$1$2$3x$4$5"
    )
    .replace(/(\d{3,4})\s*[-–]\s*(\d{3,4})\s*mm/gi, "$1x$2 mm")
    .trim();
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
  if (typeof out.siteAddress === "string") {
    out.siteAddress = sanitizeSiteAddress(out.siteAddress);
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

/** Heuristic wins on structured fields; address picked by cleanliness score */
function smartMerge(
  heuristic: QuickInputResult,
  ai: Partial<QuickInputResult>
): QuickInputResult {
  return {
    ...ai,
    ...Object.fromEntries(
      Object.entries(heuristic).filter(([, v]) => v !== null && v !== undefined)
    ),
    siteAddress: pickBestAddress(heuristic.siteAddress, ai.siteAddress ?? null),
    widthMm: heuristic.widthMm ?? ai.widthMm ?? null,
    heightMm: heuristic.heightMm ?? ai.heightMm ?? null,
    count: heuristic.count ?? ai.count ?? null,
    installDate: heuristic.installDate ?? ai.installDate ?? null,
    customerPhone: heuristic.customerPhone ?? ai.customerPhone ?? null,
    customerFirstName:
      heuristic.customerFirstName ?? ai.customerFirstName ?? null,
    customerLastName: heuristic.customerLastName ?? ai.customerLastName ?? null,
    customerName: heuristic.customerName ?? ai.customerName ?? null,
    color: heuristic.color ?? ai.color ?? null,
    glazing: heuristic.glazing ?? ai.glazing ?? null,
    category: heuristic.category ?? ai.category ?? null,
    propertyType: heuristic.propertyType ?? ai.propertyType ?? null,
    montaz: heuristic.montaz ?? ai.montaz ?? null,
    demontazStarych: heuristic.demontazStarych ?? ai.demontazStarych ?? null,
    sieteProtiHmyzu: heuristic.sieteProtiHmyzu ?? ai.sieteProtiHmyzu ?? null,
    likvidacia: heuristic.likvidacia ?? ai.likvidacia ?? null,
    parapetVnutorny: heuristic.parapetVnutorny ?? ai.parapetVnutorny ?? null,
    parapetVonkajsi: heuristic.parapetVonkajsi ?? ai.parapetVonkajsi ?? null,
    notes: ai.notes ?? heuristic.notes ?? null,
  } as QuickInputResult;
}

function sanitizeSiteAddress(raw: string): string | null {
  let s = raw.trim();
  s = s.replace(
    /^(adresa\s+a\s+ulica\s+je|adresa\s+je|ulica\s+je|adresa\s+a\s+ulica|adresa|ulica)\s+/i,
    ""
  );
  // Cut off if model pasted the rest of the transcript
  s = s.split(
    /\b(?:typ objektu|predpokladan|prepokladan|položk|plastov|farba|zasklen|telefón|meno zákaz|počet|montáž|dátum mont)/i
  )[0];
  s = s.replace(/[.,;\s]+$/g, "").trim();
  if (!s || s.length < 3) return null;
  return s;
}

function addressQuality(s: string): number {
  const t = s.trim();
  if (!t) return -1000;
  let score = 0;
  if (/\d/.test(t)) score += 40;
  if (/trenčín|bratislava|žilina|nitra|trnava|piešťany|prievidza/i.test(t))
    score += 25;
  if (/[A-Za-zÁ-ž]{3,}\s+\d+/i.test(t)) score += 50;
  if (
    /typ objektu|predpoklad|prepoklad|položk|farba|zasklen|telefón|meno zákaz|adresa a ulica|plastov/i.test(
      t
    )
  ) {
    score -= 120;
  }
  if (t.length > 55) score -= 40;
  if (t.length < 40) score += 10;
  return score;
}

function pickBestAddress(
  a?: string | null,
  b?: string | null
): string | null {
  const x = a ? sanitizeSiteAddress(a) : null;
  const y = b ? sanitizeSiteAddress(b) : null;
  if (!x) return y;
  if (!y) return x;
  return addressQuality(y) > addressQuality(x) ? y : x;
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
  else if (/okn|kná/.test(lower)) result.category = "plastove_okna";

  if (/rodinn|v\s+dome|rodinnom\s+dome|typ objektu\s+je\s+rodinn/.test(lower))
    result.propertyType = "rodinny_dom";
  else if (/byt/.test(lower)) result.propertyType = "byt";
  else if (/kancel/.test(lower)) result.propertyType = "kancelaria";

  const floorMatch = lower.match(/(\d+)\.?\s*poschod/);
  if (floorMatch) result.floor = Number(floorMatch[1]);

  // Dimensions: prefer near window/width context; allow 1200-1800 as WxH
  const dimMatch =
    lower.match(
      /(?:šírk\w*|okn\w*|kná|rozmer\w*|mm)[^\d]{0,48}(\d{3,4})\s*[x×\-–]\s*(\d{3,4})/
    ) ||
    lower.match(/(\d{3,4})\s*[x×\-–]\s*(\d{3,4})\s*mm/) ||
    lower.match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/);
  if (dimMatch) {
    result.widthMm = Number(dimMatch[1]);
    result.heightMm = Number(dimMatch[2]);
  }

  const countMatch =
    lower.match(/(?:počet\w*|početku|počet)\s*(?:sú\s*)?(?:bude\s*)?(\d{1,3})/) ||
    lower.match(/(\d+)\s*[x×]\s*(?:plastov[^ ]*\s+)?(?:okn|dver|kná)/) ||
    lower.match(
      /(?:meni[tť]|vymeni[tť]|robi[tť]|da[tť])\s+(\d+)\s+(?:plastov[^ ]*\s+)?(?:okn|dver|kná)/
    ) ||
    lower.match(/(\d+)\s+(?:ks\s+)?(?:plastov[^ ]*\s+)?(?:okn|kná)/);
  if (countMatch) {
    const n = Number(countMatch[1]);
    if (n >= 1 && n <= 200) result.count = n;
  }

  if (/trojsklo/.test(lower)) result.glazing = "trojsklo";
  else if (/dvojsklo/.test(lower)) result.glazing = "dvojsklo";

  if (/biel/.test(lower)) result.color = "biela";
  else if (/modr/.test(lower)) result.color = "modrá";
  else if (/antracit|antracitov/.test(lower)) result.color = "antracit";
  else if (/hned|orech|zlatý\s+dub|zlaty\s+dub/.test(lower)) result.color = "hnedá";
  else if (/siv|šed/.test(lower)) result.color = "sivá";
  else if (/zelen/.test(lower)) result.color = "zelená";

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
      /(?:term[ií]n|d[aá]tum\s+mont|mont[aá][zž]e\s+je)[^0-9]{0,40}(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/i
    ) || text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dateNearTerm) {
    result.installDate = normalizeSlovakDate(
      `${dateNearTerm[1]}.${dateNearTerm[2]}.${dateNearTerm[3] || new Date().getFullYear()}`
    );
  }

  // "Adresa a ulica je Vysoká 5 v Trenčíne"
  const addrIsStreetInCity = text.match(
    /(?:adresa|ulica)(?:\s+a\s+ulica)?(?:\s+je)?\s+([A-Za-zÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽáäčďéíľňóôŕšťúýž][A-Za-zÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽáäčďéíľňóôŕšťúýž\-]+)\s+(\d+[\/A-Za-z]?)\s+v\s+(Trenčíne|Bratislave|Žiline|Nitre|Trnave|Piešťanoch|Prievidzi)/i
  );
  const streetInCity = text.match(
    /\b([A-Za-zÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽáäčďéíľňóôŕšťúýž][A-Za-zÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽáäčďéíľňóôŕšťúýž\-]+)\s+(\d+[\/A-Za-z]?)\s+v\s+(Trenčíne|Bratislave|Žiline|Nitre|Trnave|Piešťanoch|Prievidzi)\b/i
  );
  const cityThenStreet = text.match(
    /(Trenčín|Bratislava|Žilina|Nitra|Trnava|Piešťany|Prievidza|Považská Bystrica)\s+na\s+([A-Za-zÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽáäčďéíľňóôŕšťúýž][A-Za-zÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽáäčďéíľňóôŕšťúýž\-]+)\s+(\d+[\/A-Za-z]?)/i
  );
  const streetThenCity = text.match(
    /na\s+([A-Za-zÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽáäčďéíľňóôŕšťúýž][A-Za-zÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽáäčďéíľňóôŕšťúýž\-]+)\s+(\d+[\/A-Za-z]?)\s+v\s+(Trenčíne|Bratislave|Žiline|Nitre|Trnave|Piešťanoch|Prievidzi)/i
  );
  const streetCommaCity = text.match(
    /([A-Za-zÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽáäčďéíľňóôŕšťúýž][A-Za-zÁÄČĎÉÍĽŇÓÔŔŠŤÚÝŽáäčďéíľňóôŕšťúýž\-]+)\s+(\d+[\/A-Za-z]?)\s*,\s*(Trenčín|Bratislava|Žilina|Nitra|Trnava|Piešťany|Prievidza)/i
  );

  if (addrIsStreetInCity) {
    result.siteAddress = `${improveStreetCase(addrIsStreetInCity[1])} ${addrIsStreetInCity[2]}, ${normalizeCityName(addrIsStreetInCity[3])}`;
  } else if (streetInCity) {
    result.siteAddress = `${improveStreetCase(streetInCity[1])} ${streetInCity[2]}, ${normalizeCityName(streetInCity[3])}`;
  } else if (cityThenStreet) {
    result.siteAddress = `${improveStreetCase(cityThenStreet[2])} ${cityThenStreet[3]}, ${normalizeCityName(cityThenStreet[1])}`;
  } else if (streetThenCity) {
    result.siteAddress = `${improveStreetCase(streetThenCity[1])} ${streetThenCity[2]}, ${normalizeCityName(streetThenCity[3])}`;
  } else if (streetCommaCity) {
    result.siteAddress = `${improveStreetCase(streetCommaCity[1])} ${streetCommaCity[2]}, ${normalizeCityName(streetCommaCity[3])}`;
  } else {
    const city = text.match(
      /(Trenčín|Bratislava|Žilina|Nitra|Trnava|Piešťany|Prievidza|Považská Bystrica)/i
    );
    if (city) result.siteAddress = normalizeCityName(city[1]);
  }

  if (result.siteAddress) {
    result.siteAddress = sanitizeSiteAddress(result.siteAddress);
  }

  return result;
}

function normalizeCityName(raw: string): string {
  const map: Record<string, string> = {
    trenčíne: "Trenčín",
    trencine: "Trenčín",
    trenčín: "Trenčín",
    bratislave: "Bratislava",
    žiline: "Žilina",
    ziline: "Žilina",
    nitre: "Nitra",
    trnave: "Trnava",
    piešťanoch: "Piešťany",
    piestanoch: "Piešťany",
    prievidzi: "Prievidza",
  };
  const key = raw.toLowerCase();
  if (map[key]) return map[key];
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function improveStreetCase(raw: string): string {
  let s = raw.trim();
  if (s.toLowerCase().endsWith("ovej")) {
    s = `${s.slice(0, -4)}ova`;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}
