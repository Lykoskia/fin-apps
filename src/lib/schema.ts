import { z } from "zod"
import { validateIBAN, modelPattern, purposeValues } from "./croatianPaymentData"

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
      if (!val || val === "0,00") return true
      // Convert Croatian format to number for validation
      const numVal = parseFloat(val.replace(/\./g, "").replace(",", "."))
      return numVal >= 0.01 && numVal < 1000000
    }, "Iznos mora biti između 0,01 i 999.999,99")
    .optional()
    .default("0,00"),
  model: z.string().regex(modelPattern, "Model mora biti u ispravnom formatu").length(2, "Model mora imati 2 znamenke").default("00"),
  reference: z.string().max(22, "Poziv na broj mora biti 22 znaka ili manje")
    .refine(
      (value) => {
        if (!value || value.trim() === "") return true // Allow empty values
        const trimmedValue = value.trim()
        // Check if it contains only digits and hyphens
        if (!/^[0-9-]+$/.test(trimmedValue)) return false
        // Can't start or end with a hyphen
        if (trimmedValue.startsWith("-") || trimmedValue.endsWith("-")) return false
        // Split by hyphens and check each segment
        const segments = trimmedValue.split("-")
        // Maximum 4 segments (3 hyphens)
        if (segments.length > 4) return false
        // Each segment must have at most 11 digits
        for (const segment of segments) {
          if (segment.length > 11) return false
        }
        return true
      },
      "Poziv na broj mora sadržavati samo znamenke i crte (max 3), s najviše 11 znamenki između crta."
    )
    .optional(),
  purpose: z.enum(purposeValues, {
    errorMap: () => ({ message: "Odaberite valjanu namjenu" }),
  }).optional(),
  description: z.string().max(35, "Opis mora biti 35 znakova ili manje").trim().optional(),
})

export type PaymentFormData = z.infer<typeof paymentFormSchema>