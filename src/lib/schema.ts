// src/lib/schema.ts
import { z } from "zod";
import { validateIBAN, modelPattern, purposeValues } from "./croatianPaymentData";

// Define the valid model patterns (e.g., HR00, HR01, ..., HR99)
// We need this to differentiate models. The pattern `^HR\d{2}$` might be too general
// and '00' is a default placeholder. The FINA document lists specific valid models.
// Let's assume `modelPattern` from `croatianPaymentData` already reflects specific HR models.

export const paymentFormSchema = z.object({
  // Sender fields - all truly optional
  senderName: z.string().max(30, "Ime mora biti 30 znakova ili manje").trim().optional(),
  senderStreet: z.string().max(27, "Ulica mora biti 27 znakova ili manje").trim().optional(),
  senderPostcode: z.string()
    .regex(/^\d{5}$/, "Poštanski broj mora imati 5 znamenki")
    .optional()
    .or(z.literal("")).optional(),
  senderCity: z.string().max(21, "Grad mora biti 21 znak ili manje").trim().optional(),

  // Receiver fields - only name and IBAN required
  receiverName: z.string().max(25, "Ime mora biti 25 znakova ili manje").trim(),
  receiverStreet: z.string().max(25, "Ulica mora biti 25 znakova ili manje").trim().optional(),
  receiverPostcode: z.string()
    .regex(/^\d{5}$/, "Poštanski broj mora imati 5 znamenki")
    .optional()
    .or(z.literal("")).optional(),
  receiverCity: z.string().max(21, "Grad mora biti 21 znak ili manje").trim().optional(),

  // Payment validation - only IBAN is required
  iban: z
    .string()
    .regex(/^HR\d{19}$/, "IBAN mora biti u formatu HR + 19 brojeva")
    .refine(validateIBAN, "Neispravan IBAN"),
  amount: z
    .string()
    .refine(
      (val) => !val || val === "0,00" || /^\d{1,3}(\.\d{3})*,\d{2}$|^\d{1,6},\d{2}$/.test(val),
      "Iznos mora biti u formatu 0,00",
    )
    .refine((val) => {
      if (!val || val === "0,00") return true;
      // Convert Croatian format to number for validation
      const numVal = parseFloat(val.replace(/\./g, "").replace(",", "."));
      return numVal >= 0.01 && numVal < 1000000;
    }, "Iznos mora biti između 0,01 i 999.999,99")
    .optional()
    .default("0,00"),
  // Model should be like 'HR00', but Zod length(2) on '00' and regex for 'HR..' in pattern,
  // let's adjust for clarity. The input value itself is probably '00', '01', etc.
  model: z.string()
    .regex(modelPattern, "Model mora biti u ispravnom formatu (npr. '01', '02', 'HR00')")
    .length(2, "Model mora imati 2 znaka (npr. '00', '01')") // Assuming we input '00', '01', etc.
    .default("00"), // Default to '00' which is a valid model, even if '00' has no reference rules
  reference: z.string().max(22, "Poziv na broj mora biti 22 znaka ili manje")
    .optional()
    // We'll move the complex validation to a .superRefine on the object level
    // to access the `model` field. For now, leave basic validation here.
    .superRefine((value, ctx) => {
      if (!value || value.trim() === "") return; // Allow empty values if optional

      const trimmedValue = value.trim();

      // 1. Check for invalid characters (non-digits or hyphens)
      if (!/^[0-9-]+$/.test(trimmedValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Poziv na broj može sadržavati samo znamenke i crte.",
        });
        return;
      }

      // 2. Cannot start or end with a hyphen
      if (trimmedValue.startsWith("-")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Poziv na broj ne može početi crticom.",
        });
        return;
      }
      if (trimmedValue.endsWith("-")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Poziv na broj ne može završiti crticom.",
        });
        return;
      }

      // 3. Cannot have consecutive hyphens
      if (trimmedValue.includes("--")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Poziv na broj ne može sadržavati dvije uzastopne crte.",
        });
        return;
      }

      // We'll do segment specific validation in the object-level superRefine
    }),
  purpose: z.enum(purposeValues, {
    errorMap: () => ({ message: "Odaberite valjanu namjenu" }),
  }).optional(),
  description: z.string().max(35, "Opis mora biti 35 znakova ili manje").trim().optional(),
})
// Now, apply the object-level superRefine for cross-field validation
.superRefine((data, ctx) => {
  const model = data.model;
  const reference = data.reference;

  if (!reference || reference.trim() === "") return; // If reference is empty, no further validation needed here

  const trimmedReference = reference.trim();
  const segments = trimmedReference.split("-");

  // RULE: Maximum 3 segments (P1-P2-P3), which means at most 2 hyphens
  if (segments.length > 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reference"], // Associate error with the reference field
      message: "Dozvoljeno je najviše 2 crte (format P1-P2-P3).",
    });
    return;
  }

  // Define default and model-specific segment length rules
  let p1MaxLength = 12;
  let p2MaxLength = 12;
  const p3MaxLength = 12; // P3 isn't explicitly mentioned with exceptions in the FINA text, assume general 12

  // Apply model-specific rules from the FINA document
  switch (model) {
    case "12": // HR12
    case "41": // HR41
      p1MaxLength = 13;
      break;
    case "24": // HR24
      p2MaxLength = 13;
      break;
    case "69": // HR69 - P2 is OIB
      // OIB has a fixed length of 11 digits
      p2MaxLength = 11;
      if (segments[1] && segments[1].length !== 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reference"],
          message: `Za model HR${model}, P2 (OIB) mora imati točno 11 znamenki.`,
        });
        return;
      }
      break;
    case "83": // HR83
      // P2 has a fixed length of 16 digits
      p2MaxLength = 16;
      if (segments[1] && segments[1].length !== 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reference"],
          message: `Za model HR${model}, P2 mora imati točno 16 znamenki.`,
        });
        return;
      }
      break;
    default:
      // General rule: P1, P2, P3 max 12
      // This default means `p1MaxLength`, `p2MaxLength`, `p3MaxLength` remain 12,
      // which is correct for models not specifically listed as exceptions.
      break;
  }

  // Validate each segment based on its position and the model's rules
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    let currentSegmentMaxLength: number;
    let segmentName: string;

    switch (i) {
      case 0: // P1
        currentSegmentMaxLength = p1MaxLength;
        segmentName = "P1";
        break;
      case 1: // P2
        currentSegmentMaxLength = p2MaxLength;
        segmentName = "P2";
        break;
      case 2: // P3
        currentSegmentMaxLength = p3MaxLength;
        segmentName = "P3";
        break;
      default:
        // This case should ideally not be reached due to `segments.length > 3` check above
        currentSegmentMaxLength = 12; // Fallback
        segmentName = `Segment ${i + 1}`;
    }

    if (segment.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reference"],
        message: `Segment ${segmentName} ne može biti prazan.`,
      });
      return;
    }

    // Only apply max length check if not already handled by exact length for HR69/HR83
    if ((model === "69" && i === 1) || (model === "83" && i === 1)) {
      // Exact length already checked above, skip max length check here for P2
    } else if (segment.length > currentSegmentMaxLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reference"],
        message: `Segment ${segmentName} (kod modela HR${model}) može imati najviše ${currentSegmentMaxLength} znamenki.`,
      });
      return;
    }
  }
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;
