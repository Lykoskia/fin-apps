"use client"

import React, { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PaymentFormData } from "@/lib/schema"

interface VisualPaymentFormProps {
  formData: PaymentFormData
  barcodeUrl: string
  isVisible?: boolean
}

/**
 * VisualPaymentForm Component
 * 
 * This component renders a visual representation of the Croatian HUB 3A payment form.
 * It overlays form field values onto the official form template in real-time as the user types.
 * 
 * Key Features:
 * - Real-time text overlay on the form image
 * - Barcode placement after successful form submission
 * - Maintains sync with form state
 * - Character-by-character updates
 * - Proper Croatian character support
 * 
 * Form Structure (HUB 3A):
 * - PLATITELJ (Sender): name and address only - no IBAN/model/reference
 * - PRIMATELJ (Receiver): name, address, IBAN, model, reference
 * - Payment details: amount, purpose, description
 */
export function VisualPaymentForm({ 
  formData, 
  barcodeUrl,
  isVisible = true 
}: VisualPaymentFormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [showVisual, setShowVisual] = useState(isVisible)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Form field positions - calibrated to match the HUB 3A form layout
  // These coordinates are approximate and may need fine-tuning based on the actual image
  const FIELD_POSITIONS = {
    // Left side - Main form
    // SENDER (PLATITELJ) - only name and address, NO IBAN/model/reference
    senderName: { x: 90, y: 108, maxWidth: 280, fontSize: 11 },
    senderAddress: { x: 90, y: 123, maxWidth: 280, fontSize: 10 },
    
    // RECEIVER (PRIMATELJ) - has everything
    receiverName: { x: 90, y: 273, maxWidth: 280, fontSize: 11 },
    receiverAddress: { x: 90, y: 288, maxWidth: 280, fontSize: 10 },
    receiverIBAN: { x: 435, y: 237, maxWidth: 350, fontSize: 11, mono: true, spacing: 12 },
    receiverModel: { x: 435, y: 272, maxWidth: 70, fontSize: 11, mono: true, spacing: 12 },
    receiverReference: { x: 535, y: 272, maxWidth: 250, fontSize: 11, mono: true, spacing: 12 },
    
    // Payment details
    purposeCode: { x: 435, y: 335, maxWidth: 80, fontSize: 11 },
    description: { x: 560, y: 335, maxWidth: 220, fontSize: 10 },
    
    amount: { x: 725, y: 108, maxWidth: 140, fontSize: 12, mono: true, align: 'right' },
    currency: { x: 585, y: 108, maxWidth: 60, fontSize: 11 },
    
    // Right side - Receipt section
    receiptCurrency: { x: 1125, y: 95, maxWidth: 200, fontSize: 10 },
    receiptAmount: { x: 1125, y: 95, maxWidth: 340, fontSize: 10, align: 'right' },
    receiptSenderName: { x: 1125, y: 153, maxWidth: 340, fontSize: 9 },
    receiptReceiverIBAN: { x: 1125, y: 235, maxWidth: 340, fontSize: 10 },
    receiptReceiverModelRef: { x: 1125, y: 280, maxWidth: 340, fontSize: 10 },
    receiptDescription: { x: 1125, y: 333, maxWidth: 340, fontSize: 9 },
    
    // Barcode position (lower left)
    barcode: { x: 95, y: 470, width: 300, height: 100 },
  }

  /**
   * Draws text on the canvas at specified position with proper formatting
   * Handles monospaced fonts, alignment, and character spacing
   */
  const drawText = (
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
      align = 'left'
    } = options

    ctx.font = mono 
      ? `${fontSize}px "Courier New", monospace` 
      : `${fontSize}px Arial, sans-serif`
    ctx.fillStyle = '#000000'
    ctx.textBaseline = 'top'

    if (mono && spacing > 0) {
      // For monospaced text with custom spacing (like IBANs)
      let currentX = x
      for (let i = 0; i < text.length; i++) {
        ctx.fillText(text[i], currentX, y)
        currentX += spacing
      }
    } else {
      // Regular text with alignment
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
  }

  /**
   * Main rendering function
   * Clears canvas and redraws all form fields and barcode (if available)
   */
  const renderForm = () => {
    const canvas = canvasRef.current
    const image = imageRef.current
    
    if (!canvas || !image || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match image
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // ==========================================
    // SENDER (PLATITELJ) - Name and Address ONLY
    // ==========================================
    if (formData.senderName) {
      drawText(ctx, formData.senderName, 
        FIELD_POSITIONS.senderName.x, 
        FIELD_POSITIONS.senderName.y,
        { 
          maxWidth: FIELD_POSITIONS.senderName.maxWidth,
          fontSize: FIELD_POSITIONS.senderName.fontSize 
        }
      )
    }

    if (formData.senderStreet || formData.senderPostcode || formData.senderCity) {
      const address = [
        formData.senderStreet,
        formData.senderPostcode,
        formData.senderCity
      ].filter(Boolean).join(', ')
      
      drawText(ctx, address,
        FIELD_POSITIONS.senderAddress.x,
        FIELD_POSITIONS.senderAddress.y,
        {
          maxWidth: FIELD_POSITIONS.senderAddress.maxWidth,
          fontSize: FIELD_POSITIONS.senderAddress.fontSize
        }
      )
    }

    // NOTE: Sender IBAN, model, and reference are NOT drawn - they don't exist in your form!

    // ==========================================
    // RECEIVER (PRIMATELJ) - Has everything
    // ==========================================
    if (formData.receiverName) {
      drawText(ctx, formData.receiverName,
        FIELD_POSITIONS.receiverName.x,
        FIELD_POSITIONS.receiverName.y,
        {
          maxWidth: FIELD_POSITIONS.receiverName.maxWidth,
          fontSize: FIELD_POSITIONS.receiverName.fontSize
        }
      )
    }

    if (formData.receiverStreet || formData.receiverPostcode || formData.receiverCity) {
      const address = [
        formData.receiverStreet,
        formData.receiverPostcode,
        formData.receiverCity
      ].filter(Boolean).join(', ')
      
      drawText(ctx, address,
        FIELD_POSITIONS.receiverAddress.x,
        FIELD_POSITIONS.receiverAddress.y,
        {
          maxWidth: FIELD_POSITIONS.receiverAddress.maxWidth,
          fontSize: FIELD_POSITIONS.receiverAddress.fontSize
        }
      )
    }

    // Receiver IBAN (this is THE iban field from your form)
    if (formData.iban && formData.iban.length > 2) {
      const iban = formData.iban.replace(/\s/g, '')
      drawText(ctx, iban,
        FIELD_POSITIONS.receiverIBAN.x,
        FIELD_POSITIONS.receiverIBAN.y,
        {
          maxWidth: FIELD_POSITIONS.receiverIBAN.maxWidth,
          fontSize: FIELD_POSITIONS.receiverIBAN.fontSize,
          mono: true,
          spacing: FIELD_POSITIONS.receiverIBAN.spacing
        }
      )
    }

    // Receiver Model and Reference (these are THE model/reference fields from your form)
    if (formData.model && formData.model !== "00") {
      drawText(ctx, `HR${formData.model}`,
        FIELD_POSITIONS.receiverModel.x,
        FIELD_POSITIONS.receiverModel.y,
        {
          maxWidth: FIELD_POSITIONS.receiverModel.maxWidth,
          fontSize: FIELD_POSITIONS.receiverModel.fontSize,
          mono: true,
          spacing: FIELD_POSITIONS.receiverModel.spacing
        }
      )
    }

    if (formData.reference) {
      drawText(ctx, formData.reference,
        FIELD_POSITIONS.receiverReference.x,
        FIELD_POSITIONS.receiverReference.y,
        {
          maxWidth: FIELD_POSITIONS.receiverReference.maxWidth,
          fontSize: FIELD_POSITIONS.receiverReference.fontSize,
          mono: true,
          spacing: FIELD_POSITIONS.receiverReference.spacing
        }
      )
    }

    // ==========================================
    // PAYMENT DETAILS
    // ==========================================
    
    // Purpose code
    if (formData.purpose) {
      drawText(ctx, formData.purpose,
        FIELD_POSITIONS.purposeCode.x,
        FIELD_POSITIONS.purposeCode.y,
        {
          maxWidth: FIELD_POSITIONS.purposeCode.maxWidth,
          fontSize: FIELD_POSITIONS.purposeCode.fontSize
        }
      )
    }

    // Description
    if (formData.description) {
      drawText(ctx, formData.description,
        FIELD_POSITIONS.description.x,
        FIELD_POSITIONS.description.y,
        {
          maxWidth: FIELD_POSITIONS.description.maxWidth,
          fontSize: FIELD_POSITIONS.description.fontSize
        }
      )
    }

    // Amount
    if (formData.amount && formData.amount !== "0,00") {
      drawText(ctx, formData.amount,
        FIELD_POSITIONS.amount.x,
        FIELD_POSITIONS.amount.y,
        {
          maxWidth: FIELD_POSITIONS.amount.maxWidth,
          fontSize: FIELD_POSITIONS.amount.fontSize,
          mono: true,
          align: 'right'
        }
      )
    }

    // Currency (always EUR for Croatian payments)
    drawText(ctx, "EUR",
      FIELD_POSITIONS.currency.x,
      FIELD_POSITIONS.currency.y,
      {
        maxWidth: FIELD_POSITIONS.currency.maxWidth,
        fontSize: FIELD_POSITIONS.currency.fontSize
      }
    )

    // ==========================================
    // RECEIPT SECTION (Right side)
    // ==========================================
    
    // Currency and amount
    if (formData.amount && formData.amount !== "0,00") {
      const amountText = `EUR ${formData.amount}`
      drawText(ctx, amountText,
        FIELD_POSITIONS.receiptAmount.x,
        FIELD_POSITIONS.receiptAmount.y,
        {
          maxWidth: FIELD_POSITIONS.receiptAmount.maxWidth,
          fontSize: FIELD_POSITIONS.receiptAmount.fontSize,
          align: 'right'
        }
      )
    }

    // Receipt sender name
    if (formData.senderName) {
      drawText(ctx, formData.senderName,
        FIELD_POSITIONS.receiptSenderName.x,
        FIELD_POSITIONS.receiptSenderName.y,
        {
          maxWidth: FIELD_POSITIONS.receiptSenderName.maxWidth,
          fontSize: FIELD_POSITIONS.receiptSenderName.fontSize
        }
      )
    }

    // Receipt receiver IBAN
    if (formData.iban && formData.iban.length > 2) {
      drawText(ctx, formData.iban,
        FIELD_POSITIONS.receiptReceiverIBAN.x,
        FIELD_POSITIONS.receiptReceiverIBAN.y,
        {
          maxWidth: FIELD_POSITIONS.receiptReceiverIBAN.maxWidth,
          fontSize: FIELD_POSITIONS.receiptReceiverIBAN.fontSize
        }
      )
    }

    // Receipt model and reference (for receiver)
    if (formData.model && formData.reference && formData.model !== "00") {
      const modelRef = `HR${formData.model} ${formData.reference}`
      drawText(ctx, modelRef,
        FIELD_POSITIONS.receiptReceiverModelRef.x,
        FIELD_POSITIONS.receiptReceiverModelRef.y,
        {
          maxWidth: FIELD_POSITIONS.receiptReceiverModelRef.maxWidth,
          fontSize: FIELD_POSITIONS.receiptReceiverModelRef.fontSize
        }
      )
    }

    // Receipt description
    if (formData.description) {
      drawText(ctx, formData.description,
        FIELD_POSITIONS.receiptDescription.x,
        FIELD_POSITIONS.receiptDescription.y,
        {
          maxWidth: FIELD_POSITIONS.receiptDescription.maxWidth,
          fontSize: FIELD_POSITIONS.receiptDescription.fontSize
        }
      )
    }

    // ==========================================
    // BARCODE (only after successful submission)
    // ==========================================
    if (barcodeUrl) {
      const barcodeImage = new Image()
      barcodeImage.crossOrigin = "anonymous"
      barcodeImage.onload = () => {
        ctx.drawImage(
          barcodeImage,
          FIELD_POSITIONS.barcode.x,
          FIELD_POSITIONS.barcode.y,
          FIELD_POSITIONS.barcode.width,
          FIELD_POSITIONS.barcode.height
        )
      }
      barcodeImage.src = barcodeUrl
    }
  }

  // Re-render whenever form data or barcode changes
  useEffect(() => {
    if (imageLoaded) {
      renderForm()
    }
  }, [formData, barcodeUrl, imageLoaded])

  // Handle image load
  useEffect(() => {
    const image = imageRef.current
    if (image && image.complete) {
      setImageLoaded(true)
      renderForm()
    }
  }, [])

  if (!showVisual) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Vizualni prikaz uplatnice</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVisual(true)}
              className="h-6 w-6 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Vizualni prikaz uplatnice</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVisual(false)}
            className="h-6 w-6 p-0"
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative w-full overflow-auto rounded-lg border bg-white">
          {/* Base form image */}
          <img
            ref={imageRef}
            src="/hub3a-form.png"
            alt="HUB 3A Payment Form Template"
            className="w-full h-auto"
            onLoad={() => {
              setImageLoaded(true)
              renderForm()
            }}
          />
          {/* Canvas overlay for text and barcode */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Uplatnica se ažurira dok tipkate. Barkod će se pojaviti nakon uspješnog generiranja.
        </p>
      </CardContent>
    </Card>
  )
}
