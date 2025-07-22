"use server"

import type { z } from "zod"
import bwipjs from "bwip-js"
import { paymentFormSchema } from "./schema"
import type { PaymentFormData } from "./schema"
import type { SubmitPaymentFormResult } from "./types"

export async function submitPaymentForm(formData: z.infer<typeof paymentFormSchema>): Promise<SubmitPaymentFormResult> {
  const result = paymentFormSchema.safeParse(formData)

  if (!result.success) {
    return { success: false, errors: result.error.flatten() }
  }

  try {
    const barcodeData = formatHUB3Data(result.data)
    const barcodeUrl = await generateBarcode(barcodeData)

    return { success: true, barcodeUrl }
  } catch {
    return {
      success: false,
      errors: {
        formErrors: ["Failed to generate barcode"],
        fieldErrors: {},
      },
    }
  }
}

function formatHUB3Data(data: PaymentFormData): string {
  const amountString = data.amount
    .replace(/\./g, "")
    .replace(",", "")
    .padStart(15, "0");

  return [
    "HRVHUB30",
    "EUR",
    amountString,
    data.senderName,
    data.senderStreet,
    `${data.senderPostcode} ${data.senderCity}`,
    data.receiverName,
    data.receiverStreet,
    `${data.receiverPostcode} ${data.receiverCity}`,
    data.iban,
    `HR${data.model}`,
    data.reference,
    data.purpose,
    data.description,
  ].join("\n")
}

async function generateBarcode(data: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "pdf417",
        text: data,
        scale: 3,
        height: 10,
        width: 0.254
      },
      (err, png) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)))
        } else {
          const buffer = Buffer.isBuffer(png) ? png : Buffer.from(png)
          const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`
          resolve(dataUrl)
        }
      },
    )
  })
}