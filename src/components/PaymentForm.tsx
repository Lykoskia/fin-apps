"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { submitPaymentForm } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LuPlay,
  LuDownload,
  LuShare2,
  LuLoader,
  LuTestTube,
  LuRotateCcw,
  LuFileText,
} from "react-icons/lu"
import { useSearchParamsState } from "@/hooks/useSearchParamsState"
import type { SubmitPaymentFormResult } from "@/lib/types"
import Image from "next/image"
import { paymentFormSchema } from "@/lib/schema"
import type { PaymentFormData } from "@/lib/schema"
import { purposeValues } from "@/lib/croatianPaymentData"
import { PlaceLookup } from "./PlaceLookup"
import AmountInput from "@/components/AmountInput"
import { IBANCalculator } from "./IBANCalculator"
import LoadingSpinner from "./LoadingSpinner"
import { useToast } from "@/hooks/use-toast"
import { EnhancedDataManager } from "./EnhancedDataManager"
import FormLinkComponent from "./FormLinkComponent"
import BarcodeDecoder from "./BarcodeDecoder"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Lightbulb,
  Terminal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { VisualPaymentForm } from "./VisualPaymentForm"

// Import the PDF generation utility
import { generatePaymentPdf } from "@/lib/generate-payment-pdf"

interface ValidationStep {
  description: string
  calculation?: string
  result?: string
  type: "info" | "calculation" | "success" | "error"
  explanation?: string
  details?: ValidationStep[]
}

interface ValidationResult {
  country: boolean
  checkDigits: boolean
  length: boolean
  bankCode: boolean
  accountNumber: boolean
  overall: boolean
  steps: ValidationStep[]
}

import {
  validateIBAN,
  validateCroatianAccountNumber,
  validateCroatianBankCode,
} from "@/lib/croatianPaymentData"

type EnhancedDataManagerCallback = (data: Partial<PaymentFormData>) => void

const IBANStructureDisplay: React.FC<{ iban: string }> = ({ iban }) => {
  const [showDetails, setShowDetails] = useState(true)

  const analyzeIBAN = useCallback(
    (
      ibanValue: string,
    ): {
      country: string
      check: string
      bank: string
      account: string
      parts: ValidationStep[]
    } => {
      const cleanIban = ibanValue.replace(/\s/g, "").toUpperCase()

      const parts: ValidationStep[] = []

      if (cleanIban.length >= 2) {
        parts.push({
          description: "Kod zemlje",
          result: cleanIban.substring(0, 2),
          type: cleanIban.startsWith("HR") ? "success" : "error",
          explanation: cleanIban.startsWith("HR") ? "✓ Hrvatska" : "✗ Nije HR",
        })
      }

      if (cleanIban.length >= 4) {
        parts.push({
          description: "Kontrolne znamenke",
          result: cleanIban.substring(2, 4),
          type: cleanIban.length >= 4 ? "info" : "error",
          explanation: "Služe za provjeru ispravnosti IBAN-a",
        })
      }

      if (cleanIban.length >= 11) {
        parts.push({
          description: "Kod banke",
          result: cleanIban.substring(4, 11),
          type: cleanIban.length >= 11 ? "info" : "error",
          explanation: "7 znamenki - identifikacija banke",
        })
      }

      if (cleanIban.length >= 21) {
        parts.push({
          description: "Broj računa",
          result: cleanIban.substring(11, 21),
          type: cleanIban.length === 21 ? "info" : "error",
          explanation: "10 znamenki - broj računa",
        })
      }

      return {
        country: cleanIban.substring(0, 2),
        check: cleanIban.substring(2, 4),
        bank: cleanIban.substring(4, 11),
        account: cleanIban.substring(11, 21),
        parts,
      }
    },
    [],
  )

  const { parts } = analyzeIBAN(iban)

  if (!iban || iban.length <= 2) return null

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Struktura IBAN-a
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 w-6 p-0"
          >
            {showDetails ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      {showDetails && (
        <CardContent className="pt-0 space-y-3">
          {parts.map((part, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md border bg-muted/30 p-2"
            >
              <div className="flex items-center gap-2">
                {part.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : part.type === "error" ? (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {part.description}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {part.explanation}
                  </div>
                </div>
              </div>
              <Badge
                variant={
                  part.type === "success"
                    ? "default"
                    : part.type === "error"
                      ? "destructive"
                      : "secondary"
                }
                className="font-mono text-xs"
              >
                {part.result}
              </Badge>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

const IBANControlDigitCalculator: React.FC<{ iban: string }> = ({ iban }) => {
  const [showDetails, setShowDetails] = useState(false)

  const calculateControlDigits = useCallback((ibanValue: string): ValidationStep[] => {
    const steps: ValidationStep[] = []

    if (!ibanValue || ibanValue.length < 15) {
      steps.push({
        description: "Nedovoljno podataka za izračun",
        type: "error",
      })
      return steps
    }

    try {
      const cleanIban = ibanValue.replace(/\s/g, "").toUpperCase()
      const bankAndAccount = cleanIban.substring(4)

      // Step 1: Rearrange - move HR to end and replace with 1727
      const rearranged = bankAndAccount + "1727"
      steps.push({
        description: "Presložavanje",
        calculation: `${bankAndAccount} + 1727 (HR=1727)`,
        result: rearranged,
        type: "calculation",
        explanation: "Premjestimo HR na kraj i zamijenimo s 1727",
      })

      // Step 2: Calculate mod 97
      const numericString = rearranged
      let remainder = 0

      // Process the number in chunks to avoid overflow
      for (let i = 0; i < numericString.length; i++) {
        remainder = (remainder * 10 + parseInt(numericString[i])) % 97
      }

      steps.push({
        description: "Izračun ostatka",
        calculation: `${numericString} mod 97`,
        result: remainder.toString(),
        type: "calculation",
        explanation: "Izračunavamo ostatak dijeljenja s 97",
      })

      // Step 3: Calculate control digits
      const controlDigits = 98 - remainder
      const formattedControlDigits = controlDigits.toString().padStart(2, "0")

      steps.push({
        description: "Kontrolne znamenke",
        calculation: `98 - ${remainder}`,
        result: formattedControlDigits,
        type:
          controlDigits === parseInt(cleanIban.substring(2, 4))
            ? "success"
            : "error",
        explanation: `Trebaju biti: ${formattedControlDigits}, u IBAN-u: ${cleanIban.substring(2, 4)}`,
      })
    } catch {
      steps.push({
        description: "Greška u izračunu",
        type: "error",
        explanation: "Nije moguće izračunati kontrolne znamenke",
      })
    }

    return steps
  }, [])

  const steps = calculateControlDigits(iban)
  const hasValidData = iban && iban.length >= 15

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Izračun kontrolnih znamenki
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 w-6 p-0"
            disabled={!hasValidData}
          >
            {showDetails ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      {showDetails && hasValidData && (
        <CardContent className="pt-0 space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-start gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {step.type === "success" ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  ) : step.type === "error" ? (
                    <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {step.description}
                    </div>
                    {step.calculation && (
                      <div className="mt-1 break-all rounded bg-muted/50 px-2 py-1 font-mono text-xs text-muted-foreground">
                        {step.calculation}
                      </div>
                    )}
                    {step.explanation && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {step.explanation}
                      </div>
                    )}
                  </div>
                </div>
                {step.result && (
                  <Badge
                    variant={
                      step.type === "success"
                        ? "default"
                        : step.type === "error"
                          ? "destructive"
                          : "secondary"
                    }
                    className="flex-shrink-0 font-mono text-xs"
                  >
                    {step.result}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

const IBANValidationDisplay: React.FC<{ iban: string }> = ({ iban }) => {
  const validateIBANDetailed = useCallback((ibanValue: string): ValidationResult => {
    const steps: ValidationStep[] = []

    if (!ibanValue) {
      return {
        country: false,
        checkDigits: false,
        length: false,
        bankCode: false,
        accountNumber: false,
        overall: false,
        steps,
      }
    }

    const cleanIban = ibanValue.replace(/\s/g, "").toUpperCase()

    // 1. Country check
    const country = cleanIban.startsWith("HR")
    steps.push({
      description: "Kod zemlje (HR)",
      result: cleanIban.substring(0, 2),
      type: country ? "success" : "error",
      explanation: country ? "✓ Hrvatska (HR)" : "✗ Mora počinjati s HR",
    })

    // 2. Length check
    const length = cleanIban.length === 21
    steps.push({
      description: "Duljina IBAN-a",
      result: `${cleanIban.length}/21`,
      type: length ? "success" : "error",
      explanation: length
        ? "✓ Ispravna duljina (21 znak)"
        : `✗ Mora imati točno 21 znak (trenutno ${cleanIban.length})`,
    })

    // 3. IBAN Check Digits (overall mathematical validation)
    let checkDigits = false
    if (country && length) {
      try {
        checkDigits = validateIBAN(cleanIban)
        steps.push({
          description: "IBAN kontrolne znamenke",
          result: checkDigits ? "Ispravne" : "Neispravne",
          type: checkDigits ? "success" : "error",
          explanation: checkDigits
            ? "✓ Matematički ispravne (ISO 7064 Mod 97-10)"
            : "✗ Pogrešan kontrolni broj prema ISO 7064",
        })
      } catch {
        checkDigits = false
        steps.push({
          description: "IBAN kontrolne znamenke",
          result: "Greška",
          type: "error",
          explanation: "✗ Greška pri provjeri IBAN kontrolnih znamenki",
        })
      }
    } else {
      steps.push({
        description: "IBAN kontrolne znamenke",
        result: "N/A",
        type: "info",
        explanation: "Provjera nakon ispravke koda zemlje i duljine",
      })
    }

    // 4. Bank Code Validation (7 digits, with control digit)
    let bankCodeValid = false
    const bankCode = cleanIban.substring(4, 11)
    if (length && country && bankCode.length === 7) {
      bankCodeValid = validateCroatianBankCode(bankCode)
      steps.push({
        description: "Kod banke (7 znamenki)",
        result: bankCode,
        type: bankCodeValid ? "success" : "error",
        explanation: bankCodeValid
          ? "✓ Ispravan format i kontrolna znamenka"
          : "✗ Neispravan kod banke ili kontrolna znamenka",
      })
    } else if (length && country) {
      steps.push({
        description: "Kod banke (7 znamenki)",
        result: bankCode.length === 0 ? "N/A" : bankCode,
        type: "error",
        explanation: `✗ Mora biti točno 7 znamenki (trenutno ${bankCode.length})`,
      })
    } else {
      steps.push({
        description: "Kod banke (7 znamenki)",
        result: "N/A",
        type: "info",
        explanation: "Provjera nakon ispravke IBAN duljine i koda zemlje",
      })
    }

    // 5. Account Number Validation (10 digits, with control digit)
    let accountNumberValid = false
    const accountNumber = cleanIban.substring(11, 21)
    if (length && country && accountNumber.length === 10) {
      accountNumberValid = validateCroatianAccountNumber(accountNumber)
      steps.push({
        description: "Broj računa (10 znamenki)",
        result: accountNumber,
        type: accountNumberValid ? "success" : "error",
        explanation: accountNumberValid
          ? "✓ Ispravan format i kontrolna znamenka"
          : "✗ Neispravan broj računa ili kontrolna znamenka",
      })
    } else if (length && country) {
      steps.push({
        description: "Broj računa (10 znamenki)",
        result: accountNumber.length === 0 ? "N/A" : accountNumber,
        type: "error",
        explanation: `✗ Mora biti točno 10 znamenki (trenutno ${accountNumber.length})`,
      })
    } else {
      steps.push({
        description: "Broj računa (10 znamenki)",
        result: "N/A",
        type: "info",
        explanation: "Provjera nakon ispravke IBAN duljine i koda zemlje",
      })
    }

    const overall = country && length && checkDigits && bankCodeValid && accountNumberValid
    return {
      country,
      checkDigits,
      length,
      bankCode: bankCodeValid,
      accountNumber: accountNumberValid,
      overall,
      steps,
    }
  }, [])

  const validationResults = validateIBANDetailed(iban)

  if (!iban || iban.length <= 2) return null

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {validationResults.overall ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          IBAN validacija
          <Badge
            variant={validationResults.overall ? "default" : "destructive"}
            className="ml-auto text-xs"
          >
            {validationResults.overall ? "Valjan" : "Nevaljan"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {validationResults.steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-md border bg-muted/30 p-2"
          >
            <div className="flex items-center gap-2">
              {step.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : step.type === "error" ? (
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
              <div>
                <span className="text-sm font-medium text-foreground">
                  {step.description}
                </span>
                <div className="text-xs text-muted-foreground">
                  {step.explanation}
                </div>
              </div>
            </div>
            {step.result && (
              <Badge
                variant={
                  step.type === "success"
                    ? "default"
                    : step.type === "error"
                      ? "destructive"
                      : "secondary"
                }
                className="font-mono text-xs"
              >
                {step.result}
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

const BankAccountValidationDisplay: React.FC<{ iban: string }> = ({
  iban,
}) => {
  const validateBankAccount = useCallback(
    (ibanValue: string): ValidationResult => {
      const steps: ValidationStep[] = []
      let bankCodeValid = false,
        accountNumberValid = false

      if (!ibanValue || ibanValue.length < 11) {
        return {
          country: false,
          checkDigits: false,
          length: false,
          bankCode: false,
          accountNumber: false,
          overall: false,
          steps,
        }
      }

      const cleanIban = ibanValue.replace(/\s/g, "").toUpperCase()
      const bankCode = cleanIban.substring(4, 11)
      const accountNumber = cleanIban.substring(11, 21)

      // Bank code validation (7 digits, with control digit)
      if (bankCode.length === 7) {
        bankCodeValid = validateCroatianBankCode(bankCode)
        steps.push({
          description: "Kod banke",
          result: bankCode,
          type: bankCodeValid ? "success" : "error",
          explanation: bankCodeValid
            ? "✓ 7 znamenki i ispravna kontrolna znamenka"
            : "✗ Neispravan kod banke ili kontrolna znamenka",
        })
      } else {
        steps.push({
          description: "Kod banke",
          result: bankCode,
          type: "error",
          explanation: `✗ Mora biti 7 znamenki (trenutno ${bankCode.length})`,
        })
      }

      // Account number validation (10 digits, with control digit)
      if (accountNumber.length === 10) {
        accountNumberValid = validateCroatianAccountNumber(accountNumber)
        steps.push({
          description: "Broj računa",
          result: accountNumber,
          type: accountNumberValid ? "success" : "error",
          explanation: accountNumberValid
            ? "✓ 10 znamenki i ispravna kontrolna znamenka"
            : "✗ Neispravan broj računa ili kontrolna znamenka",
        })
      } else {
        steps.push({
          description: "Broj računa",
          result: accountNumber,
          type: "error",
          explanation: `✗ Mora biti 10 znamenki (trenutno ${accountNumber.length})`,
        })
      }

      const overall = bankCodeValid && accountNumberValid
      return {
        country: false,
        checkDigits: false,
        length: false,
        bankCode: bankCodeValid,
        accountNumber: accountNumberValid,
        overall,
        steps,
      }
    },
    [],
  )

  const validationResults = validateBankAccount(iban)

  if (!iban || iban.length < 11) return null

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {validationResults.overall ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          Analiza banke i računa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {validationResults.steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-md border bg-muted/30 p-2"
          >
            <div className="flex items-center gap-2">
              {step.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className="text-sm font-medium text-foreground">
                {step.description}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  step.type === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {step.explanation}
              </span>
            </div>
            {step.result && step.result !== "N/A" && (
              <Badge
                variant={step.type === "success" ? "default" : "destructive"}
                className="font-mono text-xs"
              >
                {step.result}
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Overall validation summary component
const ValidationSummaryCard: React.FC<{ iban: string }> = ({ iban }) => {
  const validateIBANDetailed = useCallback((ibanValue: string): ValidationResult => {
    const steps: ValidationStep[] = []

    if (!ibanValue) {
      return {
        country: false,
        checkDigits: false,
        length: false,
        bankCode: false,
        accountNumber: false,
        overall: false,
        steps,
      }
    }

    const cleanIban = ibanValue.replace(/\s/g, "").toUpperCase()

    const country = cleanIban.startsWith("HR")
    const length = cleanIban.length === 21

    let checkDigits = false
    let bankCodeValid = false
    let accountNumberValid = false

    if (country && length) {
      try {
        // Use the original validateIBAN function
        checkDigits = validateIBAN(cleanIban)

        const bankCode = cleanIban.substring(4, 11)
        const accountNumber = cleanIban.substring(11, 21)

        bankCodeValid = validateCroatianBankCode(bankCode)
        accountNumberValid = validateCroatianAccountNumber(accountNumber)
      } catch {
        checkDigits = false
        bankCodeValid = false
        accountNumberValid = false
      }
    }

    const overall = country && length && checkDigits && bankCodeValid && accountNumberValid
    return {
      country,
      checkDigits,
      length,
      bankCode: bankCodeValid,
      accountNumber: accountNumberValid,
      overall,
      steps,
    }
  }, [])

  const validationResults = validateIBANDetailed(iban)

  if (!iban || iban.length <= 2) return null

  return (
    <Card className="w-full border-2 border-dashed border-muted-foreground/20">
      <CardContent className="pt-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            {validationResults.overall ? (
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {validationResults.overall ? "IBAN je valjan ✓" : "IBAN nije valjan ✗"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {validationResults.overall
                ? "Svi provjeri su prošli uspješno"
                : "Jedan ili više provjera nije prošao uspješno"}
            </p>
          </div>

          {/* Quick status indicators */}
          <div className="grid grid-cols-2 gap-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Kontrolne znamenke</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  validationResults.checkDigits
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {validationResults.checkDigits ? "✓ Valjane" : "✗ Nevaljane"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Broj računa</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  validationResults.accountNumber
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {validationResults.accountNumber ? "✓ Valjan" : "✗ Nevaljan"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Custom Reference Number Input Component
const ReferenceNumberInput: React.FC<{
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  model: string // Passed from the form field
}> = ({ value, onChange, onBlur, model }) => {
  const [internalError, setInternalError] = useState<string | null>(null)

  // Clear reference when model is 99 (as per your existing logic)
  useEffect(() => {
    if (model === "99" && value) {
      onChange("")
    }
  }, [model, onChange, value])

  const validateReferenceClient = useCallback((refValue: string): boolean => {
    if (!refValue || refValue.trim() === "") {
      setInternalError(null)
      return true
    }

    const trimmedValue = refValue.trim();

    // 1. Check for invalid characters (non-digits or hyphens)
    if (!/^[0-9-]+$/.test(trimmedValue)) {
      setInternalError("Poziv na broj može sadržavati samo znamenke i crte.");
      return false;
    }

    // 2. Cannot start or end with a hyphen
    if (trimmedValue.startsWith("-")) {
      setInternalError("Poziv na broj ne može početi crticom.");
      return false;
    }
    if (trimmedValue.endsWith("-")) {
      setInternalError("Poziv na broj ne može završiti crticom.");
      return false;
    }

    // 3. Cannot have consecutive hyphens
    if (trimmedValue.includes("--")) {
      setInternalError("Poziv na broj ne može sadržavati dvije uzastopne crte.");
      return false;
    }

    const segments = trimmedValue.split("-");

    // FINA RULE: Maximum 3 segments (P1-P2-P3), which means at most 2 hyphens
    if (segments.length > 3) {
      setInternalError("Dozvoljeno je najviše 2 crte (format P1-P2-P3).");
      return false;
    }

    // Define default and model-specific segment length rules
    let p1MaxLength = 12;
    let p2MaxLength = 12;
    const p3MaxLength = 12; // P3 isn't explicitly mentioned with exceptions, assume general 12

    // Apply model-specific rules from the FINA document
    switch (model) {
      case "12": // HR12
      case "41": // HR41
        p1MaxLength = 13;
        break;
      case "24": // HR24
        p2MaxLength = 13;
        break;
      case "69": // HR69 - P2 is OIB, fixed 11 digits
        p2MaxLength = 11;
        if (segments[1] && segments[1].length !== 11) {
          setInternalError(`Za model HR${model}, P2 (OIB) mora imati točno 11 znamenki.`);
          return false;
        }
        break;
      case "83": // HR83 - P2 is fixed 16 digits
        p2MaxLength = 16;
        if (segments[1] && segments[1].length !== 16) {
          setInternalError(`Za model HR${model}, P2 mora imati točno 16 znamenki.`);
          return false;
        }
        break;
      // Default case remains as max 12 for all P1, P2, P3
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
          currentSegmentMaxLength = 12; // Should not be reached
          segmentName = `Segment ${i + 1}`;
      }

      if (segment.length === 0) {
        setInternalError(`Segment ${segmentName} ne može biti prazan.`);
        return false;
      }

      // Only apply max length check if not already handled by exact length for HR69/HR83 P2
      if (!((model === "69" && i === 1) || (model === "83" && i === 1))) {
        if (segment.length > currentSegmentMaxLength) {
          setInternalError(`Segment ${segmentName} (kod modela HR${model}) može imati najviše ${currentSegmentMaxLength} znamenki.`);
          return false;
        }
      }
    }

    setInternalError(null);
    return true;
  }, [model]); // Add 'model' to useCallback dependencies

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Sanitize: allow only digits and hyphens, and prevent consecutive hyphens
    let sanitizedValue = "";
    for (let i = 0; i < newValue.length; i++) {
      const char = newValue[i];
      if (char === "-") {
        if (i === 0 || (sanitizedValue.length > 0 && sanitizedValue[sanitizedValue.length - 1] === "-")) {
          continue; // Skip if first char or consecutive hyphen
        }
        sanitizedValue += char;
      } else if (/[0-9]/.test(char)) {
        sanitizedValue += char;
      }
    }

    // Enforce max total length of 22 including hyphens
    sanitizedValue = sanitizedValue.substring(0, 22);

    onChange(sanitizedValue);
    // Client-side validation is called here to provide immediate feedback
    validateReferenceClient(sanitizedValue);
  };

  const handleBlur = () => {
    let finalValue = value.trim();

    // Ensure it doesn't end with a hyphen on blur
    if (finalValue.endsWith("-")) {
      finalValue = finalValue.slice(0, -1);
      onChange(finalValue); // Update form state with trimmed value
    }

    // Always re-validate on blur with the final (possibly trimmed) value
    validateReferenceClient(finalValue);

    onBlur(); // Call react-hook-form's onBlur
  };

  return (
    <div>
      <Input
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="npr. 123-456-789"
        className={`bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow ${internalError ? "border-red-500 focus:border-red-500" : ""
          }`}
        maxLength={22} // MaxLength is a good client-side hint, but our handleChange enforces it better
      />
      {internalError && (
        <p className="mt-1 text-sm text-red-500">{internalError}</p>
      )}
    </div>
  )
}

const formSchema = paymentFormSchema

export default function PaymentForm() {
  const [barcodeUrl, setBarcodeUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [currentFormUrl, setCurrentFormUrl] = useState<string>("")
  const { searchParams, setSearchParams } = useSearchParamsState()

  const { toast } = useToast()

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: "",
      senderStreet: "",
      senderPostcode: "",
      senderCity: "",
      receiverName: "",
      receiverStreet: "",
      receiverPostcode: "",
      receiverCity: "",
      iban: "HR",
      amount: "0,00",
      model: "00",
      reference: "",
      purpose: "OTHR",
      description: "",
    },
  })

  const handleFormUrlChange = useCallback((url: string) => {
    setCurrentFormUrl(url)
  }, [])

  // Clear reference when model is 99
  useEffect(() => {
    const model = form.watch("model")
    const reference = form.watch("reference")

    if (model === "99" && reference) {
      form.setValue("reference", "")
    }
  }, [form.watch("model"), form])

  useEffect(() => {
    const formData: { [key: string]: string } = {}
    searchParams.forEach((value: string, key: string | number) => {
      if (key === "amount" && value) {
        formData[key] = decodeURIComponent(value)
      } else {
        formData[key] = value
      }
    })
    if (Object.keys(formData).length > 0) {
      form.reset({
        ...form.getValues(),
        ...formData,
      })
    }
  }, [searchParams, form])

  useEffect(() => {
    const savedData = document.cookie
      .split("; ")
      .find((row) => row.startsWith("senderData="))
      ?.split("=")[1]

    if (savedData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(savedData))
        form.reset({
          ...form.getValues(),
          ...parsedData,
        })
      } catch (e) {
        console.error("Error parsing saved sender data:", e)
      }
    }
  }, [form])

  const handleBarcodeDecoded = useCallback(
    (decodedData: Partial<PaymentFormData>) => {
      console.log("Decoded barcode data:", decodedData)

      form.reset({
        ...form.getValues(),
        ...decodedData,
      })

      setBarcodeUrl("")

      const newParams = new URLSearchParams()
      Object.entries(decodedData).forEach(([key, value]) => {
        if (value && value !== "") {
          newParams.set(key, String(value))
        }
      })
      setSearchParams(newParams)

      toast({
        title: "Barkod uspješno učitan",
        description: "Podaci su uneseni u obrazac. Možete ih sada mijenjati po potrebi.",
      })
    },
    [form, setSearchParams, toast],
  )

  const handleSenderDataLoad: EnhancedDataManagerCallback = useCallback(
    (data) => {
      form.setValue("senderName", data.senderName || "")
      form.setValue("senderStreet", data.senderStreet || "")
      form.setValue("senderPostcode", data.senderPostcode || "")
      form.setValue("senderCity", data.senderCity || "")
    },
    [form],
  )

  const handleReceiverDataLoad: EnhancedDataManagerCallback = useCallback(
    (data) => {
      form.setValue("receiverName", data.receiverName || "")
      form.setValue("receiverStreet", data.receiverStreet || "")
      form.setValue("receiverPostcode", data.receiverPostcode || "")
      form.setValue("receiverCity", data.receiverCity || "")
      form.setValue("iban", data.iban || "HR")
    },
    [form],
  )

  const handleIBANSelect = useCallback(
    (iban: string) => {
      form.setValue("iban", iban)
    },
    [form],
  )

  async function onSubmit(values: PaymentFormData) {
    setIsLoading(true)
    try {
      const result: SubmitPaymentFormResult = await submitPaymentForm(values)

      if (result.success && result.barcodeUrl) {
        setBarcodeUrl(result.barcodeUrl)
        toast({
          title: "Obrazac je uspješno poslan",
          description: "Vaš barkod je generiran.",
        })
        const newParams = new URLSearchParams()
        Object.entries(values).forEach(([key, value]) => {
          if (value && String(value).trim() !== "") {
            newParams.set(key, String(value))
          }
        })
        setSearchParams(newParams)
      } else {
        toast({
          title: "Greška",
          description:
            "Došlo je do greške prilikom slanja obrasca. Molimo pokušajte ponovno.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Greška",
        description:
          "Došlo je do greške prilikom slanja obrasca. Molimo pokušajte ponovno.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleIbanPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedContent = event.clipboardData
      .getData("text/plain")
      .replace(/\s/g, "")
      .toUpperCase()
    const currentValue = event.currentTarget.value
    const selectionStart = event.currentTarget.selectionStart ?? 0
    const selectionEnd = event.currentTarget.selectionEnd ?? 0

    const newValue =
      currentValue.substring(0, selectionStart) +
      pastedContent +
      currentValue.substring(selectionEnd)

    const ibanPattern = /^HR\d{19}$/

    if (!ibanPattern.test(newValue) || newValue.length > 21) {
      event.preventDefault()
    }
  }

  const createBarcodeCanvas = async (imageSrc: string): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const padding = 4
        const canvas = document.createElement("canvas")
        canvas.width = img.width + padding * 2
        canvas.height = img.height + padding * 2

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.drawImage(img, padding, padding, img.width, img.height)

        resolve(canvas)
      }
      img.onerror = (error) => {
        console.error("Image loading error:", error)
        reject(new Error("Failed to load barcode image"))
      }
      img.src = imageSrc
    })
  }

  const handleDownload = async () => {
    if (barcodeUrl) {
      try {
        const canvas = await createBarcodeCanvas(barcodeUrl)

        canvas.toBlob(
          (blob: Blob | null) => {
            if (!blob) {
              toast({
                title: "Error",
                description: "Failed to create image blob.",
                variant: "destructive",
              })
              return
            }

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.style.display = "none"
            a.href = url
            a.download = "barcode-with-background.png"
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
          },
          "image/png",
        )
      } catch (error) {
        console.error("Error downloading barcode:", error)
        toast({
          title: "Error",
          description: "Failed to download the barcode.",
          variant: "destructive",
        })
      }
    }
  }

  const handleShare = async () => {
    if (!barcodeUrl) {
      toast({
        title: "Error",
        description: "No barcode has been generated yet.",
        variant: "destructive",
      })
      return
    }

    try {
      const canvas = await createBarcodeCanvas(barcodeUrl)

      canvas.toBlob(
        async (blob: Blob | null) => {
          if (!blob) {
            toast({
              title: "Error",
              description: "Failed to create image blob.",
              variant: "destructive",
            })
            return
          }

          const file = new File([blob], "hub3-barkod.png", { type: "image/png" })

          if (navigator.share) {
            try {
              await navigator.share({
                files: [file],
                title: "HUB3 Barcode",
                text: "HUB3 barkod",
              })
            } catch (error) {
              console.error("Error sharing:", error)
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.style.display = "none"
              a.href = url
              a.download = "hub3-barkod.png"
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
              document.body.removeChild(a)
            }
          } else {
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.style.display = "none"
            a.href = url
            a.download = "hub3-barkod.png"
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast({
              title: "Info",
              description:
                "Vaš preglednik ne podržava izravno dijeljenje. Barkod je preuzet umjesto toga.",
            })
          }
        },
        "image/png",
      )
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Error",
        description: "Došlo je do greške prilikom dijeljenja barkoda.",
        variant: "destructive",
      })
    }
  }

  const handleGeneratePdf = async () => {
    if (!currentFormUrl) {
      toast({
        title: "Greška",
        description: "URL obrasca nije dostupan za generiranje PDF-a.",
        variant: "destructive",
      })
      return
    }

    setIsPdfGenerating(true)
    try {
      const currentFormData = form.getValues()
      await generatePaymentPdf({
        formData: currentFormData,
        barcodeImageUrl: barcodeUrl,
        formLink: currentFormUrl,
      })

      toast({
        title: "PDF generiran",
        description: "Uplatnica je uspješno generirana i preuzeta.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Greška",
        description:
          "Došlo je do greške prilikom generiranja PDF-a. Molimo pokušajte ponovno.",
        variant: "destructive",
      })
    } finally {
      setIsPdfGenerating(false)
    }
  }

  const fillDummyData = useCallback(() => {
    const dummyData: PaymentFormData = {
      senderName: "Pero Perić",
      senderStreet: "Nikole Tesle 1",
      senderPostcode: "51000",
      senderCity: "Rijeka",
      receiverName: "Ana Anić",
      receiverStreet: "Stjepana Radića 2",
      receiverPostcode: "10000",
      receiverCity: "Zagreb",
      iban: "HR8323600009999999991",
      amount: "9.999,99",
      model: "00",
      reference: "123-456-789",
      purpose: "OTHR",
      description: "Uplata",
    }
    form.reset(dummyData)
  }, [form])

  const resetForm = useCallback(() => {
    form.reset({
      senderName: "",
      senderStreet: "",
      senderPostcode: "",
      senderCity: "",
      receiverName: "",
      receiverStreet: "",
      receiverPostcode: "",
      receiverCity: "",
      iban: "HR",
      amount: "0,00",
      model: "00",
      reference: "",
      purpose: "OTHR",
      description: "",
    })
    setBarcodeUrl("")
    setSearchParams(new URLSearchParams())
  }, [form, setSearchParams])

  return (
    <div className="w-full">
      {/* Large screen layout: 3 columns */}
      <div className="hidden xl:grid xl:grid-cols-[320px,1fr,320px] xl:gap-6 xl:items-start">
        {/* Left sidebar - Saved Senders + IBAN Analysis */}
        <div className="sticky top-4 space-y-4">
          <EnhancedDataManager
            type="sender"
            currentData={{
              senderName: form.watch("senderName"),
              senderStreet: form.watch("senderStreet"),
              senderPostcode: form.watch("senderPostcode"),
              senderCity: form.watch("senderCity"),
            }}
            onDataLoad={handleSenderDataLoad}
          />

          <IBANStructureDisplay iban={form.watch("iban")} />
          <IBANControlDigitCalculator iban={form.watch("iban")} />
          <IBANValidationDisplay iban={form.watch("iban")} />
        </div>

        {/* Center - Main Form */}
        <Card className="mx-auto w-full max-w-7xl bg-background">
          <CardHeader>
            <CardTitle className="text-center">Barkod za plaćanje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex justify-center space-x-4">
              <Button
                onClick={fillDummyData}
                className="shadow-green-500 hover:shadow-blue-500 hover:scale-105 hover:opacity-75 shadow-md"
              >
                <LuTestTube className="mr-2 h-4 w-4" /> Demo
              </Button>
              <Button
                onClick={resetForm}
                className="shadow-red-500 hover:shadow-blue-500 hover:scale-105 hover:opacity-75 shadow-md"
                variant="destructive"
              >
                <LuRotateCcw className="mr-2 h-4 w-4" /> Resetiraj
              </Button>
            </div>

            <div className="mb-8">
              <BarcodeDecoder onDataDecoded={handleBarcodeDecoded} />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Sender Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Pošiljatelj</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ime i prezime{" "}
                            <span className="text-sm text-muted-foreground">
                              max 30
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="npr. Ivo Ivić"
                              className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                              maxLength={30}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="senderStreet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Adresa{" "}
                            <span className="text-sm text-muted-foreground">
                              max 27
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="npr. Ilica 1"
                              className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                              maxLength={27}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <PlaceLookup section="sender" form={form} />
                </div>

                {/* Receiver Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Primatelj</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="receiverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ime i prezime{" "}
                            <span className="text-sm text-muted-foreground">
                              max 25
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="npr. Ana Anić"
                              className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                              maxLength={25}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receiverStreet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Adresa{" "}
                            <span className="text-sm text-muted-foreground">
                              max 25
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="npr. Trg bana Jelačića 1"
                              className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                              maxLength={25}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <PlaceLookup section="receiver" form={form} />
                </div>

                {/* Payment Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Podaci o plaćanju</h3>

                  <div className="mb-4">
                    <IBANCalculator onIBANSelect={handleIBANSelect} />
                  </div>

                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="HR + 19 brojeva"
                            className="font-mono bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                            maxLength={21}
                            onPaste={handleIbanPaste}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Iznos (EUR)</FormLabel>
                          <FormControl>
                            <AmountInput field={field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="00">HR00</SelectItem>
                              <SelectItem value="01">HR01</SelectItem>
                              <SelectItem value="02">HR02</SelectItem>
                              <SelectItem value="03">HR03</SelectItem>
                              <SelectItem value="04">HR04</SelectItem>
                              <SelectItem value="05">HR05</SelectItem>
                              <SelectItem value="06">HR06</SelectItem>
                              <SelectItem value="07">HR07</SelectItem>
                              <SelectItem value="08">HR08</SelectItem>
                              <SelectItem value="09">HR09</SelectItem>
                              <SelectItem value="10">HR10</SelectItem>
                              <SelectItem value="11">HR11</SelectItem>
                              <SelectItem value="12">HR12</SelectItem>
                              <SelectItem value="13">HR13</SelectItem>
                              <SelectItem value="14">HR14</SelectItem>
                              <SelectItem value="15">HR15</SelectItem>
                              <SelectItem value="16">HR16</SelectItem>
                              <SelectItem value="17">HR17</SelectItem>
                              <SelectItem value="18">HR18</SelectItem>
                              <SelectItem value="19">HR19</SelectItem>
                              <SelectItem value="23">HR23</SelectItem>
                              <SelectItem value="24">HR24</SelectItem>
                              <SelectItem value="26">HR26</SelectItem>
                              <SelectItem value="27">HR27</SelectItem>
                              <SelectItem value="28">HR28</SelectItem>
                              <SelectItem value="29">HR29</SelectItem>
                              <SelectItem value="30">HR30</SelectItem>
                              <SelectItem value="31">HR31</SelectItem>
                              <SelectItem value="33">HR33</SelectItem>
                              <SelectItem value="34">HR34</SelectItem>
                              <SelectItem value="35">HR35</SelectItem>
                              <SelectItem value="40">HR40</SelectItem>
                              <SelectItem value="41">HR41</SelectItem>
                              <SelectItem value="42">HR42</SelectItem>
                              <SelectItem value="43">HR43</SelectItem>
                              <SelectItem value="55">HR55</SelectItem>
                              <SelectItem value="62">HR62</SelectItem>
                              <SelectItem value="63">HR63</SelectItem>
                              <SelectItem value="64">HR64</SelectItem>
                              <SelectItem value="65">HR65</SelectItem>
                              <SelectItem value="67">HR67</SelectItem>
                              <SelectItem value="68">HR68</SelectItem>
                              <SelectItem value="69">HR69</SelectItem>
                              <SelectItem value="99">HR99</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Namjena</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted">
                                <SelectValue placeholder="Odaberite namjenu" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {purposeValues.map((purpose) => (
                                <SelectItem key={purpose} value={purpose}>
                                  {purpose}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Poziv na broj{" "}
                            <span className="text-sm text-muted-foreground">
                              max 22
                            </span>
                          </FormLabel>
                          <FormControl>
                            <ReferenceNumberInput
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              model={form.watch("model")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Opis plaćanja{" "}
                            <span className="text-sm text-muted-foreground">
                              max 35
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="npr. plaćanje računa"
                              className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                              maxLength={35}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <ValidationSummaryCard iban={form.watch("iban")} />

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    className="animate-bounce w-full shadow-green-500 hover:shadow-blue-500 hover:scale-105 hover:opacity-75 shadow-md"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                        Generiram...
                      </>
                    ) : (
                      <>
                        <LuPlay className="mr-2 h-4 w-4" />
                        Generiraj barkod
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            {barcodeUrl && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-center">Generirani barkod</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                  <div className="inline-block bg-white p-2 ring-1 ring-black/5">
                    <Image
                      src={barcodeUrl || "/placeholder.svg"}
                      alt="Barkod za plaćanje"
                      width={300}
                      height={100}
                      className="mx-auto"
                      priority
                      aria-label="Generirani barkod za plaćanje"
                    />
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={handleDownload}
                      className="shadow-green-500 hover:shadow-blue-500 hover:scale-105 hover:opacity-75 shadow-md"
                    >
                      <LuDownload className="mr-2 h-4 w-4" /> Preuzmi
                    </Button>
                    <Button
                      onClick={handleShare}
                      className="shadow-green-500 hover:shadow-blue-500 hover:scale-105 hover:opacity-75 shadow-md"
                    >
                      <LuShare2 className="mr-2 h-4 w-4" /> Podijeli
                    </Button>
                    <Button
                      onClick={handleGeneratePdf}
                      disabled={isPdfGenerating || !barcodeUrl || !currentFormUrl}
                      className="shadow-blue-500 hover:shadow-purple-500 hover:scale-105 hover:opacity-75 shadow-md"
                    >
                      {isPdfGenerating ? (
                        <>
                          <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                          Generiram PDF...
                        </>
                      ) : (
                        <>
                          <LuFileText className="mr-2 h-4 w-4" /> Generiraj PDF
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <FormLinkComponent
              watch={form.watch}
              onFormUrlChange={handleFormUrlChange}
            />

            {/* NEW: Visual Payment Form */}
            <div className="mt-8">
              <VisualPaymentForm
                formData={form.watch()}
                barcodeUrl={barcodeUrl}
              />
            </div>
          </CardContent>
          {(isLoading || isPdfGenerating) && <LoadingSpinner />}
        </Card>

        {/* Right sidebar - Saved Receivers + Bank/Account Analysis */}
        <div className="sticky top-4 space-y-4">
          <EnhancedDataManager
            type="receiver"
            currentData={{
              receiverName: form.watch("receiverName"),
              receiverStreet: form.watch("receiverStreet"),
              receiverPostcode: form.watch("receiverPostcode"),
              receiverCity: form.watch("receiverCity"),
              iban: form.watch("iban"),
            }}
            onDataLoad={handleReceiverDataLoad}
          />

          <BankAccountValidationDisplay iban={form.watch("iban")} />
        </div>
      </div>

      {/* Mobile/tablet layout: stacked */}
      <div className="xl:hidden">
        <Card className="mx-auto w-full max-w-2xl bg-background">
          <CardHeader>
            <CardTitle className="text-center">Barkod za plaćanje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex justify-center space-x-4">
              <Button
                onClick={fillDummyData}
                className="shadow-green-500 hover:shadow-blue-500 hover:scale-105 hover:opacity-75 shadow-md"
              >
                <LuTestTube className="mr-2 h-4 w-4" /> Demo
              </Button>
              <Button
                onClick={resetForm}
                className="shadow-red-500 hover:shadow-blue-500 hover:scale-105 hover:opacity-75 shadow-md"
                variant="destructive"
              >
                <LuRotateCcw className="mr-2 h-4 w-4" /> Resetiraj
              </Button>
            </div>

            <div className="mb-8">
              <BarcodeDecoder onDataDecoded={handleBarcodeDecoded} />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Pošiljatelj</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ime i prezime{" "}
                            <span className="text-sm text-muted-foreground">
                              max 30
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="npr. Ivo Ivić"
                              className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                              maxLength={30}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="senderStreet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Adresa{" "}
                            <span className="text-sm text-muted-foreground">
                              max 27
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="npr. Ilica 1"
                              className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                              maxLength={27}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <PlaceLookup section="sender" form={form} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Primatelj</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="receiverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ime i prezime{" "}
                            <span className="text-sm text-muted-foreground">
                              max 25
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="npr. Ana Anić"
                              className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                              maxLength={25}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receiverStreet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Adresa{" "}
                            <span className="text-sm text-muted-foreground">
                              max 25
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="npr. Trg bana Jelačića 1"
                              className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                              maxLength={25}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <PlaceLookup section="receiver" form={form} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Podaci o plaćanju</h3>

                  <div className="mb-4">
                    <IBANCalculator onIBANSelect={handleIBANSelect} />
                  </div>

                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="HR + 19 brojeva"
                            className="font-mono bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                            maxLength={21}
                            onPaste={handleIbanPaste}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Iznos (EUR)</FormLabel>
                        <FormControl>
                          <AmountInput field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted">
                                <SelectValue placeholder="Odaberite model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="00">HR00</SelectItem>
                              <SelectItem value="01">HR01</SelectItem>
                              <SelectItem value="02">HR02</SelectItem>
                              <SelectItem value="03">HR03</SelectItem>
                              <SelectItem value="04">HR04</SelectItem>
                              <SelectItem value="05">HR05</SelectItem>
                              <SelectItem value="06">HR06</SelectItem>
                              <SelectItem value="07">HR07</SelectItem>
                              <SelectItem value="08">HR08</SelectItem>
                              <SelectItem value="09">HR09</SelectItem>
                              <SelectItem value="10">HR10</SelectItem>
                              <SelectItem value="11">HR11</SelectItem>
                              <SelectItem value="12">HR12</SelectItem>
                              <SelectItem value="13">HR13</SelectItem>
                              <SelectItem value="14">HR14</SelectItem>
                              <SelectItem value="15">HR15</SelectItem>
                              <SelectItem value="16">HR16</SelectItem>
                              <SelectItem value="17">HR17</SelectItem>
                              <SelectItem value="18">HR18</SelectItem>
                              <SelectItem value="19">HR19</SelectItem>
                              <SelectItem value="23">HR23</SelectItem>
                              <SelectItem value="24">HR24</SelectItem>
                              <SelectItem value="26">HR26</SelectItem>
                              <SelectItem value="27">HR27</SelectItem>
                              <SelectItem value="28">HR28</SelectItem>
                              <SelectItem value="29">HR29</SelectItem>
                              <SelectItem value="30">HR30</SelectItem>
                              <SelectItem value="31">HR31</SelectItem>
                              <SelectItem value="33">HR33</SelectItem>
                              <SelectItem value="34">HR34</SelectItem>
                              <SelectItem value="35">HR35</SelectItem>
                              <SelectItem value="40">HR40</SelectItem>
                              <SelectItem value="41">HR41</SelectItem>
                              <SelectItem value="42">HR42</SelectItem>
                              <SelectItem value="43">HR43</SelectItem>
                              <SelectItem value="55">HR55</SelectItem>
                              <SelectItem value="62">HR62</SelectItem>
                              <SelectItem value="63">HR63</SelectItem>
                              <SelectItem value="64">HR64</SelectItem>
                              <SelectItem value="65">HR65</SelectItem>
                              <SelectItem value="67">HR67</SelectItem>
                              <SelectItem value="68">HR68</SelectItem>
                              <SelectItem value="69">HR69</SelectItem>
                              <SelectItem value="99">HR99</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Namjena</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted">
                                <SelectValue placeholder="Odaberite namjenu" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {purposeValues.map((purpose) => (
                                <SelectItem key={purpose} value={purpose}>
                                  {purpose}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Poziv na broj{" "}
                          <span className="text-sm text-muted-foreground">
                            max 22
                          </span>
                        </FormLabel>
                        <FormControl>
                          <ReferenceNumberInput
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            model={form.watch("model")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Opis plaćanja{" "}
                          <span className="text-sm text-muted-foreground">
                            max 35
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="npr. plaćanje računa"
                            className="bg-muted/50 hover:shadow-green-200 hover:shadow hover:bg-muted"
                            maxLength={35}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <ValidationSummaryCard iban={form.watch("iban")} />

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    className="animate-bounce w-full shadow-green-500 hover:shadow-blue-500 hover:scale-105 hover:opacity-75 shadow-md"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                        Generiram...
                      </>
                    ) : (
                      <>
                        <LuPlay className="mr-2 h-4 w-4" />
                        Generiraj barkod
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            {barcodeUrl && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-center">Generirani barkod</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                  <div className="inline-block bg-white p-2 ring-1 ring-black/5">
                    <Image
                      src={barcodeUrl || "/placeholder.svg"}
                      alt="Barkod za plaćanje"
                      width={300}
                      height={100}
                      className="mx-auto"
                      priority
                      aria-label="Generirani barkod za plaćanje"
                    />
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={handleDownload}
                      className="shadow-green-500 hover:shadow-blue-500 hover:scale-105 hover:opacity-75 shadow-md"
                    >
                      <LuDownload className="mr-2 h-4 w-4" /> Preuzmi
                    </Button>
                    <Button
                      onClick={handleShare}
                      className="shadow-green-500 hover:shadow-blue-500 hover:scale-105 hover:opacity-75 shadow-md"
                    >
                      <LuShare2 className="mr-2 h-4 w-4" /> Podijeli
                    </Button>
                    <Button
                      onClick={handleGeneratePdf}
                      disabled={isPdfGenerating || !barcodeUrl || !currentFormUrl}
                      className="shadow-blue-500 hover:shadow-purple-500 hover:scale-105 hover:opacity-75 shadow-md"
                    >
                      {isPdfGenerating ? (
                        <>
                          <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                          Generiram PDF...
                        </>
                      ) : (
                        <>
                          <LuFileText className="mr-2 h-4 w-4" /> Generiraj PDF
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <FormLinkComponent
              watch={form.watch}
              onFormUrlChange={handleFormUrlChange}
            />

            {/* NEW: Visual Payment Form for mobile */}
            <div className="mt-8">
              <VisualPaymentForm
                formData={form.watch()}
                barcodeUrl={barcodeUrl}
              />
            </div>

            {/* Mobile validation components */}
            <div className="mt-8 space-y-4">
              <IBANStructureDisplay iban={form.watch("iban")} />
              <IBANControlDigitCalculator iban={form.watch("iban")} />
              <IBANValidationDisplay iban={form.watch("iban")} />
              <BankAccountValidationDisplay iban={form.watch("iban")} />
            </div>
          </CardContent>
          {(isLoading || isPdfGenerating) && <LoadingSpinner />}
        </Card>
      </div>
    </div>
  )
}
