"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Expand } from "lucide-react" 
import { Button } from "@/components/ui/button"
import type { PaymentFormData } from "@/lib/schema"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Define a more flexible FieldPosition interface
interface FieldPosition {
  x: number
  y: number
  maxWidth?: number
  fontSize?: number
  mono?: boolean
  spacing?: number // Spacing between characters for monospace
  align?: 'left' | 'right' | 'center'
  width?: number // Specifically for barcode
  height?: number // Specifically for barcode
}

type FieldName =
  | 'senderName'
  | 'senderStreet'
  | 'senderPostcodeCity'
  | 'receiverName'
  | 'receiverStreet'
  | 'receiverPostcodeCity'
  | 'receiverIBAN'
  | 'receiverModel'
  | 'receiverReference'
  | 'purposeCode'
  | 'description'
  | 'currency'
  | 'amount'
  | 'receiptAmount'
  | 'receiptReceiverIBAN'
  | 'receiptReceiverModelRef'
  | 'receiptDescription'
  | 'receiptSenderName'
  | 'barcode';


// --- UNIFIED MONOSPACE SETTINGS ---
const MONOSPACE_FONT_SIZE = 21;
const MONOSPACE_CHAR_SPACING = 18.1; // This is the spacing we've been refining

// Initial Field Positions - to be copied/updated after dragging
// Coordinates for the BASE IMAGE: 1200x607 pixels (hub3a-form.png)
const INITIAL_FIELD_POSITIONS: Record<FieldName, FieldPosition> = {
  // SENDER (PLATITELJ) - top left area
  senderName: { x: 80, y: 90, maxWidth: 220, fontSize: 16 },
  senderStreet: { x: 80, y: 120, maxWidth: 220, fontSize: 14 },
  senderPostcodeCity: { x: 80, y: 140, maxWidth: 220, fontSize: 14 },

  // RECEIVER (PRIMATELJ) - middle left area
  receiverName: { x: 80, y: 230, maxWidth: 220, fontSize: 16 },
  receiverStreet: { x: 80, y: 260, maxWidth: 220, fontSize: 14 },
  receiverPostcodeCity: { x: 80, y: 280, maxWidth: 220, fontSize: 14 },

  // RECEIVER IBAN - long horizontal field in middle (21 chars: HR + 19 digits)
  // Max width calculated for 21 characters.
  receiverIBAN: {
    x: 448, y: 180,
    maxWidth: 21 * MONOSPACE_CHAR_SPACING,
    fontSize: MONOSPACE_FONT_SIZE, mono: true, spacing: MONOSPACE_CHAR_SPACING
  },

  // RECEIVER Model and Reference - below IBAN
  // Model (HR00) is 4 chars. Max width calculated for 4 characters.
  receiverModel: {
    x: 320, y: 220,
    maxWidth: 4 * MONOSPACE_CHAR_SPACING,
    fontSize: MONOSPACE_FONT_SIZE, mono: true, spacing: MONOSPACE_CHAR_SPACING
  },
  // Reference (max 22 chars). Max width calculated for 22 characters.
  receiverReference: {
    x: 430, y: 220,
    maxWidth: 22 * MONOSPACE_CHAR_SPACING,
    fontSize: MONOSPACE_FONT_SIZE, mono: true, spacing: MONOSPACE_CHAR_SPACING
  },

  // Payment details - Šifra namjene (purpose) and Opis plaćanja (description)
  // Purpose (OTHR) is 4 chars. Max width calculated for 4 characters.
  purposeCode: {
    x: 320, y: 270,
    maxWidth: 4 * MONOSPACE_CHAR_SPACING,
    fontSize: MONOSPACE_FONT_SIZE, mono: true, spacing: MONOSPACE_CHAR_SPACING
  },
  description: { x: 485, y: 255, maxWidth: 365, fontSize: 16 },

  // TOP RIGHT - Currency and Amount (VALUTA and IZNOS)
  // Currency "EUR" (3 chars) - Reverting X, setting mono.
  currency: {
    x: 448, y: 70, // REVERTED X to original, now uses unified monospace settings
    maxWidth: 3 * MONOSPACE_CHAR_SPACING, // Max width calculated for 3 characters
    fontSize: MONOSPACE_FONT_SIZE, mono: true, spacing: MONOSPACE_CHAR_SPACING
  },
  // Amount (stripped digits, space-padded, right-aligned, monospace, 15 slots)
  // Max width calculated for 15 characters.
  amount: {
    x: 555, y: 70, // Kept previous X and Y position
    maxWidth: 15 * MONOSPACE_CHAR_SPACING,
    fontSize: MONOSPACE_FONT_SIZE, mono: true, align: 'right' as const, spacing: MONOSPACE_CHAR_SPACING
  },

  // RIGHT SIDE - Receipt section (Potvrda)
  receiptAmount: { x: 860, y: 75, maxWidth: 275, fontSize: 14, align: 'right' as const },
  receiptSenderName: { x: 860, y: 111, maxWidth: 275, fontSize: 14 },
  receiptReceiverIBAN: { x: 860, y: 186, maxWidth: 275, fontSize: 14 },
  receiptReceiverModelRef: { x: 860, y: 229, maxWidth: 275, fontSize: 14 },
  receiptDescription: { x: 860, y: 264, maxWidth: 275, fontSize: 14 },

  // Barcode - bottom left "Pečat korisnika PU" box
  barcode: { x: 75, y: 340, width: 300, height: 100 },
};

interface VisualPaymentFormProps {
  formData: PaymentFormData
  barcodeUrl: string
  isModalView?: boolean
}


export function VisualPaymentForm({
  formData,
  barcodeUrl,
  isModalView = false,
}: VisualPaymentFormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Field positions are now static
  const fieldPositions = INITIAL_FIELD_POSITIONS; 

  const drawText = useCallback((
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    options: {
      maxWidth?: number
      fontSize?: number
      mono?: boolean
      spacing?: number
      align?: 'left' | 'right' | 'center'
    } = {}
  ) => {
    const {
      maxWidth = 200,
      fontSize = 10,
      mono = false,
      spacing = 0,
      align = 'left',
    } = options

    ctx.font = mono
      ? `${fontSize}px "Courier New", monospace`
      : `${fontSize}px Arial, sans-serif`
    ctx.fillStyle = '#000000'
    ctx.textBaseline = 'top'

    if (mono && spacing > 0) {
      let startX = x;
      const textToRender = text;

      if (align === 'right' && maxWidth && spacing) {
          const totalTextWidth = textToRender.length * spacing;
          startX = x + maxWidth - totalTextWidth;
      }
      
      for (let i = 0; i < textToRender.length; i++) {
        ctx.fillText(textToRender[i], startX + (i * spacing), y);
      }
    } else {
      if (align === 'right') {
        ctx.textAlign = 'right'
        ctx.fillText(text, x + maxWidth, y, maxWidth)
      } else if (align === 'center') {
        ctx.textAlign = 'center'
        ctx.fillText(text, x + maxWidth / 2, y, maxWidth)
      } else {
        ctx.textAlign = 'left'
        ctx.fillText(text, x, y, maxWidth)
      }
    }
    ctx.textAlign = 'left'
  }, [])

  const renderForm = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current

    if (!canvas || !image || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    // SENDER (PLATITELJ)
    if (formData.senderName) {
      drawText(ctx, formData.senderName,
        fieldPositions.senderName.x,
        fieldPositions.senderName.y,
        { ...fieldPositions.senderName }
      )
    }

    if (formData.senderStreet) {
      drawText(ctx, formData.senderStreet,
        fieldPositions.senderStreet.x,
        fieldPositions.senderStreet.y,
        { ...fieldPositions.senderStreet }
      )
    }

    if (formData.senderPostcode || formData.senderCity) {
      const postcodeCity = [formData.senderPostcode, formData.senderCity]
        .filter(Boolean).join(' ')

      drawText(ctx, postcodeCity,
        fieldPositions.senderPostcodeCity.x,
        fieldPositions.senderPostcodeCity.y,
        { ...fieldPositions.senderPostcodeCity }
      )
    }

    // RECEIVER (PRIMATELJ)
    if (formData.receiverName) {
      drawText(ctx, formData.receiverName,
        fieldPositions.receiverName.x,
        fieldPositions.receiverName.y,
        { ...fieldPositions.receiverName }
      )
    }

    if (formData.receiverStreet) {
      drawText(ctx, formData.receiverStreet,
        fieldPositions.receiverStreet.x,
        fieldPositions.receiverStreet.y,
        { ...fieldPositions.receiverStreet }
      )
    }

    if (formData.receiverPostcode || formData.receiverCity) {
      const postcodeCity = [formData.receiverPostcode, formData.receiverCity]
        .filter(Boolean).join(' ')

      drawText(ctx, postcodeCity,
        fieldPositions.receiverPostcodeCity.x,
        fieldPositions.receiverPostcodeCity.y,
        { ...fieldPositions.receiverPostcodeCity }
      )
    }

    // Receiver IBAN
    if (formData.iban) {
      const iban = formData.iban.replace(/\s/g, '')
      drawText(ctx, iban,
        fieldPositions.receiverIBAN.x,
        fieldPositions.receiverIBAN.y,
        { ...fieldPositions.receiverIBAN }
      )
    }

    // Receiver Model (HRxx)
    if (formData.model) {
      drawText(ctx, `HR${formData.model}`,
        fieldPositions.receiverModel.x,
        fieldPositions.receiverModel.y,
        { ...fieldPositions.receiverModel }
      )
    }

    // Receiver Reference
    if (formData.reference) {
      drawText(ctx, formData.reference,
        fieldPositions.receiverReference.x,
        fieldPositions.receiverReference.y,
        { ...fieldPositions.receiverReference }
      )
    }

    // Purpose code (Šifra namjene)
    if (formData.purpose) {
      drawText(ctx, formData.purpose,
        fieldPositions.purposeCode.x,
        fieldPositions.purposeCode.y,
        { ...fieldPositions.purposeCode }
      )
    }

    // Description (Opis plaćanja)
    if (formData.description) {
      drawText(ctx, formData.description,
        fieldPositions.description.x,
        fieldPositions.description.y,
        { ...fieldPositions.description }
      )
    }

    // Amount (main slip)
    if (formData.amount && formData.amount !== "0,00") {
      const strippedAmount = formData.amount
        .replace(/\./g, '')
        .replace(',', '');
      const paddedAmount = strippedAmount.padStart(15, ' '); 

      drawText(ctx, paddedAmount,
        fieldPositions.amount.x,
        fieldPositions.amount.y,
        { ...fieldPositions.amount }
      )
    }

    // Currency (main slip - fixed "EUR")
    drawText(ctx, "EUR",
      fieldPositions.currency.x,
      fieldPositions.currency.y,
      { ...fieldPositions.currency }
    )

    // RECEIPT SECTION (Potvrda)
    if (formData.amount && formData.amount !== "0,00") {
      const amountText = `EUR ${formData.amount}`
      drawText(ctx, amountText,
        fieldPositions.receiptAmount.x,
        fieldPositions.receiptAmount.y,
        { ...fieldPositions.receiptAmount }
      )
    }

    // ADDED: Sender Name on Receipt
    if (formData.senderName) {
      drawText(ctx, formData.senderName,
        fieldPositions.receiptSenderName.x,
        fieldPositions.receiptSenderName.y,
        { ...fieldPositions.receiptSenderName }
      )
    }

    if (formData.iban) {
      drawText(ctx, formData.iban.replace(/\s/g, ''),
        fieldPositions.receiptReceiverIBAN.x,
        fieldPositions.receiptReceiverIBAN.y,
        { ...fieldPositions.receiptReceiverIBAN }
      )
    }

    if (formData.model || formData.reference) {
      const modelRef = `HR${formData.model} ${formData.reference}`
      drawText(ctx, modelRef,
        fieldPositions.receiptReceiverModelRef.x,
        fieldPositions.receiptReceiverModelRef.y,
        { ...fieldPositions.receiptReceiverModelRef }
      )
    }

    if (formData.description) {
      drawText(ctx, formData.description,
        fieldPositions.receiptDescription.x,
        fieldPositions.receiptDescription.y,
        { ...fieldPositions.receiptDescription }
      )
    }

    // BARCODE
    if (barcodeUrl) {
      const barcodeImage = new window.Image()
      barcodeImage.crossOrigin = "anonymous"
      barcodeImage.onload = () => {
        ctx.drawImage(
          barcodeImage,
          fieldPositions.barcode.x,
          fieldPositions.barcode.y,
          fieldPositions.barcode.width!,
          fieldPositions.barcode.height!
        )
      }
      barcodeImage.onerror = (e) => {
        console.error("Error loading barcode image:", e)
      }
      barcodeImage.src = barcodeUrl
    } 
  }, [formData, barcodeUrl, imageLoaded, drawText, fieldPositions])

  useEffect(() => {
    if (imageLoaded) {
      renderForm()
    }
  }, [renderForm, imageLoaded])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  useEffect(() => {
    const image = imageRef.current
    if (image && image.complete) {
      setImageLoaded(true)
    }
  }, [])

  const handleCanvasDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas reference is not available for download.");
      return;
    }

    renderForm(); // Ensure the form is rendered one last time

    setTimeout(() => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Failed to create blob from canvas.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'uplatnica-hub3a.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    }, 100); 
  }, [renderForm]);

  const visualContent = (
    <>
      <div className="relative w-full overflow-auto rounded-lg border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src="/hub3a-form.png"
          alt="HUB 3A Payment Form Template"
          className="w-full h-auto"
          onLoad={handleImageLoad}
          style={!isModalView ? { cursor: 'zoom-in' } : undefined}
          onClick={!isModalView ? () => setIsModalOpen(true) : undefined}
        />
        <canvas
          ref={canvasRef}
          className={`absolute top-0 left-0 w-full h-full pointer-events-none`}
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
      {!isModalView && (
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Uplatnica se ažurira dok tipkate. Barkod će se pojaviti nakon uspješnog generiranja.
        </p>
      )}
    </>
  )

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Vizualni prikaz uplatnice</CardTitle>
          <div className="flex gap-2">
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCanvasDownload}
              className="h-6 w-6 p-0"
              title="Preuzmi uplatnicu (slika)"
            >
              <Download className="h-3 w-3" />
            </Button>
            
            {!isModalView && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    title="Prikaži u punoj veličini"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Expand className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-screen-xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-6">
                  <DialogHeader className="mb-4">
                    <DialogTitle>Vizualni prikaz uplatnice</DialogTitle>
                    <DialogDescription>
                      Prikaz uplatnice s unesenim podacima u punoj veličini.
                      Možete je preuzeti koristeći gumb za preuzimanje.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-auto">
                    <VisualPaymentForm
                      formData={formData}
                      barcodeUrl={barcodeUrl}
                      isModalView={true}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {visualContent}
      </CardContent>
    </Card>
  )
}