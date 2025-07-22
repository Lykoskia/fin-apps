import type { z } from "zod"
import type { paymentFormSchema } from "./schema"

export type PaymentFormErrors = z.inferFlattenedErrors<typeof paymentFormSchema>

export interface SubmitPaymentFormResult {
  success: boolean
  barcodeUrl?: string
  errors?: PaymentFormErrors
}