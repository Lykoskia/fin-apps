"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PaymentFormData } from "@/lib/schema"
import Image from "next/image"

interface VisualPaymentFormProps {
  formData: PaymentFormData
  barcodeUrl: string
  isVisible?: boolean
}

export function VisualPaymentForm({ 
  formData, 
  barcodeUrl,
  isVisible = true 
}: VisualPaymentFormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [showVisual, setShowVisual] = useState(isVisible)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [debugMode, setDebugMode] = useState(false) // NEW: Debug mode toggle

  // Coordinates for 2656x1345 image with MUCH LARGER fonts for visibility when scaled
  const FIELD_POSITIONS = {
    // SENDER (PLATITELJ) - only name and address
    senderName: { x: 95, y: 88, maxWidth: 280, fontSize: 32 },
    senderAddress: { x: 95, y: 108, maxWidth: 280, fontSize: 28 },
    
    // RECEIVER (PRIMATELJ) - has everything
    receiverName: { x: 95, y: 260, maxWidth: 280, fontSize: 32 },
    receiverAddress: { x: 95, y: 280, maxWidth: 280, fontSize: 28 },
    receiverIBAN: { x: 525, y: 220, maxWidth: 430, fontSize: 32, mono: true, spacing: 15 },
    receiverModel: { x: 525, y: 265, maxWidth: 85, fontSize: 32, mono: true, spacing: 15 },
    receiverReference: { x: 640, y: 265, maxWidth: 320, fontSize: 32, mono: true, spacing: 15 },
    
    // Payment details
    purposeCode: { x: 525, y: 322, maxWidth: 100, fontSize: 32 },
    description: { x: 660, y: 322, maxWidth: 300, fontSize: 28 },
    amount: { x: 920, y: 88, maxWidth: 180, fontSize: 36, mono: true, align: 'right' as const },
    currency: { x: 740, y: 88, maxWidth: 80, fontSize: 32 },
    
    // Right side - Receipt section
    receiptAmount: { x: 1590, y: 82, maxWidth: 450, fontSize: 28, align: 'right' as const },
    receiptSenderName: { x: 1590, y: 145, maxWidth: 450, fontSize: 26 },
    receiptReceiverIBAN: { x: 1590, y: 238, maxWidth: 450, fontSize: 28 },
    receiptReceiverModelRef: { x: 1590, y: 288, maxWidth: 450, fontSize: 28 },
    receiptDescription: { x: 1590, y: 348, maxWidth: 450, fontSize: 26 },
    
    // Barcode position (lower left)
    barcode: { x: 95, y: 710, width: 380, height: 130 },
  }

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
      debug?: boolean
    } = {}
  ) => {
    const {
      maxWidth = 200,
      fontSize = 10,
      mono = false,
      spacing = 0,
      align = 'left',
      debug = false
    } = options

    // DEBUG MODE: Draw rectangle around text area
    if (debug) {
      ctx.strokeStyle = '#ff0000'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, maxWidth, fontSize * 1.5)
      
      // Draw crosshair at starting point
      ctx.beginPath()
      ctx.moveTo(x - 5, y)
      ctx.lineTo(x + 5, y)
      ctx.moveTo(x, y - 5)
      ctx.lineTo(x, y + 5)
      ctx.stroke()
    }

    ctx.font = mono 
      ? `${fontSize}px "Courier New", monospace` 
      : `${fontSize}px Arial, sans-serif`
    ctx.fillStyle = '#000000'
    ctx.textBaseline = 'top'

    if (mono && spacing > 0) {
      let currentX = x
      for (let i = 0; i < text.length; i++) {
        ctx.fillText(text[i], currentX, y)
        currentX += spacing
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

    // Show image dimensions in debug mode
    if (debugMode) {
      ctx.font = '20px Arial'
      ctx.fillStyle = '#ff0000'
      ctx.fillText(`Image: ${image.naturalWidth}x${image.naturalHeight}px`, 10, 30)
    }

    // SENDER
    if (formData.senderName) {
      drawText(ctx, formData.senderName, 
        FIELD_POSITIONS.senderName.x, 
        FIELD_POSITIONS.senderName.y,
        { 
          maxWidth: FIELD_POSITIONS.senderName.maxWidth,
          fontSize: FIELD_POSITIONS.senderName.fontSize,
          debug: debugMode
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
          fontSize: FIELD_POSITIONS.senderAddress.fontSize,
          debug: debugMode
        }
      )
    }

    // RECEIVER
    if (formData.receiverName) {
      drawText(ctx, formData.receiverName,
        FIELD_POSITIONS.receiverName.x,
        FIELD_POSITIONS.receiverName.y,
        {
          maxWidth: FIELD_POSITIONS.receiverName.maxWidth,
          fontSize: FIELD_POSITIONS.receiverName.fontSize,
          debug: debugMode
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
          fontSize: FIELD_POSITIONS.receiverAddress.fontSize,
          debug: debugMode
        }
      )
    }

    // Receiver IBAN
    if (formData.iban && formData.iban.length > 2) {
      const iban = formData.iban.replace(/\s/g, '')
      drawText(ctx, iban,
        FIELD_POSITIONS.receiverIBAN.x,
        FIELD_POSITIONS.receiverIBAN.y,
        {
          maxWidth: FIELD_POSITIONS.receiverIBAN.maxWidth,
          fontSize: FIELD_POSITIONS.receiverIBAN.fontSize,
          mono: true,
          spacing: FIELD_POSITIONS.receiverIBAN.spacing,
          debug: debugMode
        }
      )
    }

    // Receiver Model
    if (formData.model && formData.model !== "00") {
      drawText(ctx, `HR${formData.model}`,
        FIELD_POSITIONS.receiverModel.x,
        FIELD_POSITIONS.receiverModel.y,
        {
          maxWidth: FIELD_POSITIONS.receiverModel.maxWidth,
          fontSize: FIELD_POSITIONS.receiverModel.fontSize,
          mono: true,
          spacing: FIELD_POSITIONS.receiverModel.spacing,
          debug: debugMode
        }
      )
    }

    // Receiver Reference
    if (formData.reference) {
      drawText(ctx, formData.reference,
        FIELD_POSITIONS.receiverReference.x,
        FIELD_POSITIONS.receiverReference.y,
        {
          maxWidth: FIELD_POSITIONS.receiverReference.maxWidth,
          fontSize: FIELD_POSITIONS.receiverReference.fontSize,
          mono: true,
          spacing: FIELD_POSITIONS.receiverReference.spacing,
          debug: debugMode
        }
      )
    }

    // Purpose code
    if (formData.purpose) {
      drawText(ctx, formData.purpose,
        FIELD_POSITIONS.purposeCode.x,
        FIELD_POSITIONS.purposeCode.y,
        {
          maxWidth: FIELD_POSITIONS.purposeCode.maxWidth,
          fontSize: FIELD_POSITIONS.purposeCode.fontSize,
          debug: debugMode
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
          fontSize: FIELD_POSITIONS.description.fontSize,
          debug: debugMode
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
          align: 'right',
          debug: debugMode
        }
      )
    }

    // Currency
    drawText(ctx, "EUR",
      FIELD_POSITIONS.currency.x,
      FIELD_POSITIONS.currency.y,
      {
        maxWidth: FIELD_POSITIONS.currency.maxWidth,
        fontSize: FIELD_POSITIONS.currency.fontSize,
        debug: debugMode
      }
    )

    // RECEIPT SECTION
    if (formData.amount && formData.amount !== "0,00") {
      const amountText = `EUR ${formData.amount}`
      drawText(ctx, amountText,
        FIELD_POSITIONS.receiptAmount.x,
        FIELD_POSITIONS.receiptAmount.y,
        {
          maxWidth: FIELD_POSITIONS.receiptAmount.maxWidth,
          fontSize: FIELD_POSITIONS.receiptAmount.fontSize,
          align: 'right',
          debug: debugMode
        }
      )
    }

    if (formData.senderName) {
      drawText(ctx, formData.senderName,
        FIELD_POSITIONS.receiptSenderName.x,
        FIELD_POSITIONS.receiptSenderName.y,
        {
          maxWidth: FIELD_POSITIONS.receiptSenderName.maxWidth,
          fontSize: FIELD_POSITIONS.receiptSenderName.fontSize,
          debug: debugMode
        }
      )
    }

    if (formData.iban && formData.iban.length > 2) {
      drawText(ctx, formData.iban,
        FIELD_POSITIONS.receiptReceiverIBAN.x,
        FIELD_POSITIONS.receiptReceiverIBAN.y,
        {
          maxWidth: FIELD_POSITIONS.receiptReceiverIBAN.maxWidth,
          fontSize: FIELD_POSITIONS.receiptReceiverIBAN.fontSize,
          debug: debugMode
        }
      )
    }

    if (formData.model && formData.reference && formData.model !== "00") {
      const modelRef = `HR${formData.model} ${formData.reference}`
      drawText(ctx, modelRef,
        FIELD_POSITIONS.receiptReceiverModelRef.x,
        FIELD_POSITIONS.receiptReceiverModelRef.y,
        {
          maxWidth: FIELD_POSITIONS.receiptReceiverModelRef.maxWidth,
          fontSize: FIELD_POSITIONS.receiptReceiverModelRef.fontSize,
          debug: debugMode
        }
      )
    }

    if (formData.description) {
      drawText(ctx, formData.description,
        FIELD_POSITIONS.receiptDescription.x,
        FIELD_POSITIONS.receiptDescription.y,
        {
          maxWidth: FIELD_POSITIONS.receiptDescription.maxWidth,
          fontSize: FIELD_POSITIONS.receiptDescription.fontSize,
          debug: debugMode
        }
      )
    }

    // BARCODE
    if (barcodeUrl) {
      if (debugMode) {
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 3
        ctx.strokeRect(
          FIELD_POSITIONS.barcode.x,
          FIELD_POSITIONS.barcode.y,
          FIELD_POSITIONS.barcode.width,
          FIELD_POSITIONS.barcode.height
        )
      }
      
      const barcodeImage = new window.Image()
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
    } else if (debugMode) {
      // Show barcode placeholder in debug mode
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.strokeRect(
        FIELD_POSITIONS.barcode.x,
        FIELD_POSITIONS.barcode.y,
        FIELD_POSITIONS.barcode.width,
        FIELD_POSITIONS.barcode.height
      )
      ctx.font = '14px Arial'
      ctx.fillStyle = '#00ff00'
      ctx.fillText('BARCODE AREA', FIELD_POSITIONS.barcode.x + 10, FIELD_POSITIONS.barcode.y + 50)
    }
  }, [formData, barcodeUrl, imageLoaded, drawText, FIELD_POSITIONS, debugMode])

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
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="h-6 w-6 p-0"
              title={debugMode ? "Isključi debug način" : "Uključi debug način"}
            >
              <Bug className={`h-3 w-3 ${debugMode ? 'text-red-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVisual(false)}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {debugMode && (
          <div className="mb-2 rounded bg-red-50 p-2 text-xs text-red-700">
            <strong>Debug mode:</strong> Red boxes show text areas. Update coordinates in FIELD_POSITIONS.
          </div>
        )}
        <div className="relative w-full overflow-auto rounded-lg border bg-white">
          <Image
            ref={imageRef}
            src="/hub3a-form.png"
            alt="HUB 3A Payment Form Template"
            width={2656}
            height={1345}
            className="w-full h-auto"
            onLoad={handleImageLoad}
            priority
          />
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
