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
  } catch (error) {
    console.error('Barcode generation error:', error);
    return {
      success: false,
      errors: {
        formErrors: ["Failed to generate barcode"],
        fieldErrors: {},
      },
    }
  }
}

// Ensure proper encoding of Croatian characters
function normalizeCroatianText(text: string): string {
  // Ensure Croatian characters are properly normalized
  return text.normalize('NFC');
}

function formatHUB3Data(data: PaymentFormData): string {
  const amountString = data.amount
    .replace(/\./g, "")
    .replace(",", "")
    .padStart(15, "0");

  // Normalize all text fields to ensure proper Croatian character encoding
  const hub3Data = [
    "HRVHUB30",
    "EUR",
    amountString,
    normalizeCroatianText(data.senderName || ""),
    normalizeCroatianText(data.senderStreet || ""),
    normalizeCroatianText(`${data.senderPostcode || ""} ${data.senderCity || ""}`).trim(),
    normalizeCroatianText(data.receiverName || ""),
    normalizeCroatianText(data.receiverStreet || ""),
    normalizeCroatianText(`${data.receiverPostcode || ""} ${data.receiverCity || ""}`).trim(),
    data.iban || "",
    `HR${data.model || "00"}`,
    data.reference || "",
    data.purpose || "OTHR",
    normalizeCroatianText(data.description || ""),
  ];
  
  const formattedData = hub3Data.join("\n");
  console.log('Formatted HUB3 data:', formattedData);
  return formattedData;
}

async function generateBarcode(data: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // Ensure data is properly encoded as UTF-8
    const utf8Data = Buffer.from(data, 'utf8').toString('utf8');
    
    bwipjs.toBuffer(
      {
        bcid: "pdf417",
        text: utf8Data,
        scale: 3,
        height: 10,
        width: 0.254,
      },
      (err, png) => {
        if (err) {
          console.error('bwip-js error:', err);
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