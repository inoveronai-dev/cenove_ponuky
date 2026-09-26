import { z } from "zod";
import {
  GLAZING_OPTIONS,
  PRODUCT_CATEGORIES,
  PROPERTY_TYPES,
} from "@/lib/brand";

const propertyValues = PROPERTY_TYPES.map((p) => p.value) as [
  string,
  ...string[],
];
const categoryValues = PRODUCT_CATEGORIES.map((p) => p.value) as [
  string,
  ...string[],
];
const glazingValues = GLAZING_OPTIONS.map((g) => g.value) as [
  string,
  ...string[],
];

export const quoteLineItemSchema = z.object({
  id: z.string(),
  category: z.enum(categoryValues),
  widthMm: z.coerce.number().min(0),
  heightMm: z.coerce.number().min(0),
  count: z.coerce.number().int().min(1),
  color: z.string().optional().nullable(),
  glazing: z.enum(glazingValues).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type QuoteLineItemValues = z.infer<typeof quoteLineItemSchema>;

export const quoteFormSchema = z
  .object({
    customerFirstName: z.string().optional().nullable(),
    customerLastName: z.string().optional().nullable(),
    customerName: z.string().min(1, "Zadajte meno zákazníka"),
    customerEmail: z
      .string()
      .email("Neplatný e-mail")
      .optional()
      .nullable()
      .or(z.literal("")),
    customerPhone: z.string().optional().nullable(),
    siteAddress: z.string().optional().nullable(),
    propertyType: z.enum(propertyValues).optional().nullable(),
    floor: z.coerce.number().int().optional().nullable(),
    installDate: z.string().optional().nullable(),
    lineItems: z.array(quoteLineItemSchema).default([]),
    montaz: z.boolean().default(true),
    demontazStarych: z.boolean().default(false),
    likvidacia: z.boolean().default(false),
    parapetVnutorny: z.boolean().default(false),
    parapetVonkajsi: z.boolean().default(false),
    sieteProtiHmyzu: z.boolean().default(false),
    otherService: z.boolean().default(false),
    internalNotes: z.string().optional().nullable(),
    customerNotes: z.string().optional().nullable(),
    saveAsDraft: z.boolean().optional(),
    priceIsManual: z.boolean().default(false),
    priceMin: z.coerce.number().min(0).optional().nullable(),
    priceMax: z.coerce.number().min(0).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.priceIsManual) return;
    if (data.priceMin == null || Number.isNaN(Number(data.priceMin))) {
      ctx.addIssue({
        code: "custom",
        message: "Zadajte minimálnu cenu.",
        path: ["priceMin"],
      });
    }
    if (data.priceMax == null || Number.isNaN(Number(data.priceMax))) {
      ctx.addIssue({
        code: "custom",
        message: "Zadajte maximálnu cenu.",
        path: ["priceMax"],
      });
    }
    if (
      data.priceMin != null &&
      data.priceMax != null &&
      Number(data.priceMax) < Number(data.priceMin)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Maximálna cena musí byť rovnaká alebo vyššia ako minimálna.",
        path: ["priceMax"],
      });
    }
  });

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const quickInputSchema = z.object({
  siteAddress: z.string().nullable(),
  propertyType: z.enum(propertyValues).nullable(),
  floor: z.number().nullable(),
  installDate: z.string().nullable(),
  notes: z.string().nullable(),
  customerName: z.string().nullable().optional(),
  category: z.enum(categoryValues).nullable().optional(),
  widthMm: z.number().nullable().optional(),
  heightMm: z.number().nullable().optional(),
  count: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
  glazing: z.enum(glazingValues).nullable().optional(),
  montaz: z.boolean().nullable().optional(),
  demontazStarych: z.boolean().nullable().optional(),
});

export type QuickInputResult = z.infer<typeof quickInputSchema>;

export const pricingSettingsSchema = z.object({
  price_per_m2_plastove_okna: z.coerce.number().min(0),
  price_per_m2_plastove_dvere: z.coerce.number().min(0),
  price_per_m2_hlinik: z.coerce.number().min(0),
  price_per_m2_interierove_dvere: z.coerce.number().min(0),
  price_per_m2_tieniaca: z.coerce.number().min(0),
  price_per_m2_garazove_brany: z.coerce.number().min(0),
  fixed_fee: z.coerce.number().min(0),
  montaz_per_m2: z.coerce.number().min(0),
  demontaz_per_unit: z.coerce.number().min(0),
  likvidacia_fee: z.coerce.number().min(0),
  parapet_vnutorny_fee: z.coerce.number().min(0),
  parapet_vonkajsi_fee: z.coerce.number().min(0),
  siete_fee: z.coerce.number().min(0),
  other_surcharge: z.coerce.number().min(0),
  minimum_job_price: z.coerce.number().min(0),
  buffer_min_multiplier: z.coerce.number().min(0).max(2),
  buffer_max_multiplier: z.coerce.number().min(0).max(3),
});

export const companySettingsSchema = z.object({
  name: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  ico: z.string().optional().nullable(),
  dic: z.string().optional().nullable(),
  ic_dph: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  primary_color: z.string().optional().nullable(),
  quote_validity_days: z.coerce.number().int().min(1).max(365),
  notify_on_first_open: z.boolean(),
  notify_on_later_open: z.boolean(),
  notification_cooldown_hours: z.coerce.number().min(0).max(168),
  notification_email: z.string().optional().nullable(),
});
