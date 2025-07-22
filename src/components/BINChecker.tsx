"use client"

import React, { useState, useCallback, useEffect, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validateCardBasic, MII_CODES, formatCardNumber, cleanCardNumber } from "@/lib/client-validation"
import {
  validateCardComplete,
  getCroatianBanksList,
  getBankBINsList,
  generateTestCard,
} from "@/app/actions/card-validation"
import type { CardInfo, BINRange, BasicValidationResult } from "@/types/card"
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  ChevronDown,
  ChevronRight
} from "lucide-react"

// Debounce utility function
function debounce<Args extends unknown[], Return>(
  func: (...args: Args) => Return,
  wait: number
): (...args: Args) => void {
  let timeout: NodeJS.Timeout
  return (...args: Args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}


// Type guard to check if the validation result is from server
function isCardInfo(result: CardInfo | BasicValidationResult): result is CardInfo {
  return 'isValid' in result
}

// Helper function to check if validation result is valid
function isValidationValid(result: CardInfo | BasicValidationResult): boolean {
  return isCardInfo(result) ? result.isValid : result.isBasicValid
}

interface BINCheckerProps {
  onValidationChange?: (cardInfo: CardInfo) => void
  className?: string
}

export default function BINChecker({ onValidationChange, className = "" }: BINCheckerProps) {
  const [cardNumber, setCardNumber] = useState("")
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null)
  const [basicValidation, setBasicValidation] = useState<BasicValidationResult | null>(null)

  const [showGenerator, setShowGenerator] = useState(false)
  const [croatianBanks, setCroatianBanks] = useState<string[]>([])
  const [selectedBank, setSelectedBank] = useState("")
  const [selectedBIN, setSelectedBIN] = useState("")
  const [bankBins, setBankBins] = useState<BINRange[]>([])

  const [isPending, startTransition] = useTransition()
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    getCroatianBanksList().then(setCroatianBanks).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedBank) {
      getBankBINsList(selectedBank).then(setBankBins).catch(console.error)
    } else {
      setBankBins([])
    }
    setSelectedBIN("")
  }, [selectedBank])

  const debouncedServerValidation = useCallback(
    debounce((number: string) => {
      startTransition(async () => {
        try {
          const result = await validateCardComplete(number)
          setCardInfo(result)
          onValidationChange?.(result)
        } catch (error) {
          console.error("Server validation error:", error)
          setCardInfo(null)
        }
      })
    }, 500),
    [onValidationChange],
  )

  const handleCardNumberChange = useCallback(
    (number: string) => {
      if (number.length >= 6) {
        const basic = validateCardBasic(number)
        setBasicValidation(basic)
        debouncedServerValidation(number)
      } else {
        setBasicValidation(null)
        setCardInfo(null)
      }
    },
    [debouncedServerValidation],
  )

  useEffect(() => {
    handleCardNumberChange(cardNumber)
  }, [cardNumber, handleCardNumberChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanCardNumber(e.target.value)
    setCardNumber(cleaned)
  }

  const handleGenerateCard = async () => {
    if (!selectedBIN) return

    setIsGenerating(true)
    try {
      const binInfo = bankBins.find((b) => b.bin === selectedBIN)
      const targetLength = binInfo?.length[0] || 16

      const result = await generateTestCard(selectedBIN, targetLength)

      if (result.success && result.cardNumber) {
        setCardNumber(result.cardNumber)
      } else {
        console.error("Card generation failed:", result.error)
      }
    } catch (error) {
      console.error("Error generating card:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const quickTestCards = [
    { number: "4159482847593853", label: "4159... (Valjan Primjer)" },
    { number: "543778", label: "543778 (ZABA)" },
    { number: "547973", label: "547973 (OTP)" },
    { number: "403877", label: "403877 (Podravska)" },
  ]

  const displayInfo = cardInfo || basicValidation
  const isServerValidation = !!cardInfo
  const hasValidation = !!displayInfo

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Card Number Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Unos Broja Kartice</span>
          </CardTitle>
          <CardDescription>
            Unesite broj kreditne kartice za validaciju strukture i identifikaciju izdavajuće banke
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Broj Kreditne Kartice</Label>
            <Input
              id="cardNumber"
              value={formatCardNumber(cardNumber)}
              onChange={handleInputChange}
              placeholder="Unesite broj kartice (npr. 4159482847593857)..."
              className="font-mono text-lg"
              maxLength={23}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Brzi test:</span>
            {quickTestCards.map((card, index) => (
              <Button
                key={card.number}
                variant="outline"
                size="sm"
                onClick={() => setCardNumber(card.number)}
                className="text-xs"
              >
                {card.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Card Generator */}
      <Card>
        <CardHeader>
          <CardTitle
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowGenerator(!showGenerator)}
          >
            <span className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Generator Test Kartica</span>
            </span>
            {showGenerator ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {showGenerator && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hrvatska Banka</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite banku" />
                  </SelectTrigger>
                  <SelectContent>
                    {croatianBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>BIN Odabrane Banke</Label>
                <Select value={selectedBIN} onValueChange={setSelectedBIN} disabled={!selectedBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite BIN" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankBins.map((bin) => (
                      <SelectItem key={bin.bin} value={bin.bin}>
                        {bin.bin} - {bin.cardType} ({bin.cardCategory})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerateCard}
              disabled={!selectedBIN || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generiram...
                </>
              ) : (
                "Generiraj Test Karticu"
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              ⚠️ Generirane kartice su samo za testiranje i nisu prave ili aktivne kartice
            </p>
          </CardContent>
        )}
      </Card>

      {/* Validation Status */}
      {isPending && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Validacija na serveru u tijeku...</AlertDescription>
        </Alert>
      )}

      {/* Validation Results */}
      {hasValidation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {hasValidation && isValidationValid(displayInfo) ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>
                {hasValidation && isValidationValid(displayInfo)
                  ? "Valjana Kartica"
                  : "Nevažeća Kartica"}
                {!isServerValidation && " (Osnovna Provjera)"}
              </span>
            </CardTitle>
            <CardDescription>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${isServerValidation ? "bg-green-500" : "bg-yellow-500"
                    }`}
                />
                <span>
                  {isServerValidation
                    ? "Potpuna validacija (server + client)"
                    : "Osnovna validacija (samo client-side)"
                  }
                </span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayInfo && displayInfo.errors && displayInfo.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {displayInfo.errors.map((error, i) => (
                      <li key={`${error}-${i}`}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Card Structure Breakdown */}
            {displayInfo && displayInfo.structure && (
              <Card className="border-blue-200/50 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/50">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-100">
                    Struktura Kartice: {formatCardNumber(cardNumber)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-lg font-mono text-blue-600 dark:text-blue-400 mb-1">
                          {displayInfo.structure.mii}
                        </div>
                        <div className="font-medium text-sm mb-1">MII (Industrija)</div>
                        <div className="text-xs text-muted-foreground">
                          {displayInfo.structure.mii
                            ? MII_CODES[displayInfo.structure.mii as keyof typeof MII_CODES] || "Nepoznato"
                            : "N/A"}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-lg font-mono text-blue-600 dark:text-blue-400 mb-1">
                          {displayInfo.structure.mii}{displayInfo.structure.issuerIdentification}
                        </div>
                        <div className="font-medium text-sm mb-1">BIN (Izdavatelj)</div>
                        <div className="text-xs text-muted-foreground">Identifikator banke</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-lg font-mono text-blue-600 dark:text-blue-400 mb-1">
                          {displayInfo.structure.accountNumber || "N/A"}
                        </div>
                        <div className="font-medium text-sm mb-1">ID Računa</div>
                        <div className="text-xs text-muted-foreground">Identifikator kartice</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-lg font-mono text-blue-600 dark:text-blue-400 mb-1">
                          {displayInfo.structure.checkDigit}
                        </div>
                        <div className="font-medium text-sm mb-1">Kontrolna Znamenka</div>
                        <div className={`text-xs ${displayInfo && displayInfo.luhnValid ? "text-green-600" : "text-red-600"}`}>
                          {displayInfo && displayInfo.luhnValid ? "Valjan" : "Nevaljan"} Luhn
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bank Information */}
            {isServerValidation && cardInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informacije o Kartici</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tip:</span>
                      <Badge variant="secondary">{cardInfo.cardType || "Nepoznato"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kategorija:</span>
                      <Badge variant="secondary">{cardInfo.cardCategory || "Nepoznato"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duljina:</span>
                      <Badge variant="secondary">{cardNumber.length} znamenki</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informacije o Banci</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banka:</span>
                      <Badge variant="outline">{cardInfo.bank || "Nepoznato"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zemlja:</span>
                      <Badge variant="outline">{cardInfo.country || "Nepoznato"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BIN:</span>
                      <Badge variant="outline" className="font-mono">
                        {cardInfo.bin || "Nepoznato"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}