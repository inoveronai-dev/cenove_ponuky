import { z } from "zod";
import { PROPERTY_TYPES } from "@/lib/brand";

const propertyValues = PROPERTY_TYPES.map((p) => p.value) as [
  string,
  ...string[],
];

export const quoteFormSchema = z.object({
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
  originAddress: z.string().optional().nullable(),
  destinationAddress: z.string().optional().nullable(),
  originPropertyType: z.enum(propertyValues).optional().nullable(),
  originFloor: z.coerce.number().int().optional().nullable(),
  originElevator: z.boolean().optional().nullable(),
  destinationFloor: z.coerce.number().int().optional().nullable(),
  destinationElevator: z.boolean().optional().nullable(),
  distanceKm: z.coerce.number().min(0).optional().nullable(),
  boxCount: z.coerce.number().int().min(0).optional().nullable(),
  largeItems: z.string().optional().nullable(),
  wardrobesCount: z.coerce.number().int().min(0).optional().nullable(),
  bedsCount: z.coerce.number().int().min(0).optional().nullable(),
  sofasCount: z.coerce.number().int().min(0).optional().nullable(),
  appliancesCount: z.coerce.number().int().min(0).optional().nullable(),
  disassembly: z.boolean().default(false),
  assembly: z.boolean().default(false),
  packing: z.boolean().default(false),
  packingMaterial: z.boolean().default(false),
  disposal: z.boolean().default(false),
  heavyItems: z.boolean().default(false),
  protectiveWrapping: z.boolean().default(false),
  otherService: z.boolean().default(false),
  moveDate: z.string().optional().nullable(),
  estimatedHours: z.coerce.number().min(0).optional().nullable(),
  workers: z.coerce.number().int().min(0).optional().nullable(),
  vehicleType: z.string().optional().nullable(),
  isWeekend: z.boolean().default(false),
  isEvening: z.boolean().default(false),
  internalNotes: z.string().optional().nullable(),
  customerNotes: z.string().optional().nullable(),
  saveAsDraft: z.boolean().optional(),
  priceIsManual: z.boolean().default(false),
  priceMin: z.coerce.number().min(0).optional().nullable(),
  priceMax: z.coerce.number().min(0).optional().nullable(),
}).superRefine((data, ctx) => {
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
  originAddress: z.string().nullable(),
  destinationAddress: z.string().nullable(),
  propertyType: z.enum(propertyValues).nullable(),
  floor: z.number().nullable(),
  elevator: z.boolean().nullable(),
  boxCount: z.number().nullable(),
  largeItems: z.string().nullable(),
  disassembly: z.boolean().nullable(),
  assembly: z.boolean().nullable(),
  packing: z.boolean().nullable(),
  moveDate: z.string().nullable(),
  notes: z.string().nullable(),
  estimatedHours: z.number().nullable().optional(),
  workers: z.number().nullable().optional(),
  distanceKm: z.number().nullable().optional(),
  customerName: z.string().nullable().optional(),
});

export type QuickInputResult = z.infer<typeof quickInputSchema>;

export const pricingSettingsSchema = z.object({
  hourly_rate_per_worker: z.coerce.number().min(0),
  kilometer_rate: z.coerce.number().min(0),
  route_multiplier: z.coerce.number().min(0),
  fixed_fee: z.coerce.number().min(0),
  disassembly_surcharge: z.coerce.number().min(0),
  assembly_surcharge: z.coerce.number().min(0),
  packing_surcharge: z.coerce.number().min(0),
  packing_material_surcharge: z.coerce.number().min(0),
  heavy_items_surcharge: z.coerce.number().min(0),
  disposal_surcharge: z.coerce.number().min(0),
  protective_wrapping_surcharge: z.coerce.number().min(0),
  other_surcharge: z.coerce.number().min(0),
  minimum_job_price: z.coerce.number().min(0),
  weekend_surcharge_percent: z.coerce.number().min(0),
  evening_surcharge_percent: z.coerce.number().min(0),
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
