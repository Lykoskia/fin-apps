"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { submitPaymentForm } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LuPlay, LuX, LuDownload, LuShare2, LuLoader } from "react-icons/lu"
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

// Updated validation components with theme-aware colors and always-visible content
import React from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Eye, EyeOff, AlertTriangle, ArrowRight, Lightbulb, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidationStep {
  description: string
  calculation?: string
  result?: string
  type: 'info' | 'calculation' | 'success' | 'error'
  explanation?: string
}

interface DetailedValidationResult {
  isValid: boolean
  steps: ValidationStep[]
  summary: string
}

const modFix = (dividend: string, divisor: number): number => {
  return [...dividend].reduce((x, digit) => (x * 10 + Number.parseInt(digit)) % divisor, 0)
}

const StepDisplay = ({
  step
}: {
  step: ValidationStep,
  index: number
}) => (
  <div className={cn(
    "p-3 rounded-lg border-l-4 space-y-2 transition-all duration-200",
    step.type === 'success' && "border-l-green-500 bg-green-500/5 dark:bg-green-500/10",
    step.type === 'error' && "border-l-red-500 bg-red-500/5 dark:bg-red-500/10",
    step.type === 'calculation' && "border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10",
    step.type === 'info' && "border-l-gray-400 bg-gray-500/5 dark:bg-gray-500/10"
  )}>
    <div className="font-medium text-sm text-foreground">{step.description}</div>
    {step.explanation && (
      <div className="text-xs text-muted-foreground italic">{step.explanation}</div>
    )}
    {step.calculation && (
      <div className="font-mono text-xs text-muted-foreground bg-muted p-2 rounded border">
        {step.calculation}
      </div>
    )}
    {step.result && (
      <div className="font-medium text-sm text-foreground">
        → {step.result}
      </div>
    )}
  </div>
)

// IBAN Structure Display Component
function IBANStructureDisplay({ iban }: { iban: string }) {
  const formatIBANDisplay = (iban: string) => {
    const cleanIban = iban.toUpperCase().replace(/\s/g, "")

    if (cleanIban.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Unesite IBAN da vidite strukturu...</div>
          <div className="mt-2 text-sm text-muted-foreground">Format: HR + 2 kontrolne + 7 kod banke + 10 broj računa</div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="font-mono space-y-2">
          <div className="flex gap-1 lg:text-center">
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-1 rounded font-bold border border-blue-500/20">
              {cleanIban.substring(0, 2) || "HR"}
            </span>
            {cleanIban.length > 2 && (
              <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded font-bold border border-yellow-500/20">
                {cleanIban.substring(2, 4)}
              </span>
            )}
            {cleanIban.length > 4 && (
              <span className="bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded border border-green-500/20">
                {cleanIban.substring(4, 11)}
                {cleanIban.length < 11 && <span className="text-muted-foreground">{"_".repeat(11 - cleanIban.length)}</span>}
              </span>
            )}
            {cleanIban.length > 11 && (
              <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded border border-purple-500/20">
                {cleanIban.substring(11, 21)}
                {cleanIban.length < 21 && <span className="text-muted-foreground">{"_".repeat(21 - cleanIban.length)}</span>}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex lg:flex-col items-center gap-2">
            <div className="w-4 h-4 bg-blue-500/20 border border-blue-500/30 rounded"></div>
            <span className="font-semibold text-blue-600 dark:text-blue-400">HR</span>
            <span className="text-muted-foreground">- Zemljopisni kod (Hrvatska)</span>
          </div>
          <div className="flex lg:flex-col items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/30 rounded"></div>
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">{cleanIban.substring(2, 4) || "__"}</span>
            <span className="text-muted-foreground">- IBAN kontrolne znamenke</span>
          </div>
          <div className="flex lg:flex-col items-center gap-2">
            <div className="w-4 h-4 bg-green-500/20 border border-green-500/30 rounded"></div>
            <span className="font-semibold text-green-600 dark:text-green-400">{cleanIban.substring(4, 11) || "_______"}</span>
            <span className="text-muted-foreground">- Kod banke (7 znamenki)</span>
          </div>
          <div className="flex lg:flex-col items-center gap-2">
            <div className="w-4 h-4 bg-purple-500/20 border border-purple-500/30 rounded"></div>
            <span className="font-semibold text-purple-600 dark:text-purple-400">{cleanIban.substring(11, 21) || "__________"}</span>
            <span className="text-muted-foreground">- Broj računa (10 znamenki)</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>Napomena:</strong> Svaki dio IBAN-a ima specifičnu ulogu u identificiranju banke i računa.
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Struktura IBAN-a
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formatIBANDisplay(iban)}
      </CardContent>
    </Card>
  )
}

// IBAN Control Digit Calculator Component
function IBANControlDigitCalculator({ iban }: { iban: string }) {
  const [showSteps, setShowSteps] = useState(true)
  const [calculation, setCalculation] = useState<{
    controlDigits: string
    steps: ValidationStep[]
    canCalculate: boolean
  }>({
    controlDigits: "",
    steps: [],
    canCalculate: false
  })

  const calculateControlDigits = (ibanInput: string) => {
    const steps: ValidationStep[] = []
    const cleanIban = ibanInput.toUpperCase().replace(/\s/g, "")

    if (cleanIban.length === 0) {
      steps.push({
        description: "Čekamo dovoljno informacija",
        result: "Unesite kod zemlje + bank kod + broj računa",
        type: 'info',
        explanation: "Za izračun kontrolnih znamenki trebamo sve komponente osim samih kontrolnih znamenki"
      })
      return { controlDigits: "", steps, canCalculate: false }
    }

    if (!cleanIban.startsWith("HR")) {
      steps.push({
        description: "Neispravna zemlja",
        result: "Ovaj kalkulator radi samo za hrvatske IBAN-ove (HR)",
        type: 'info',
        explanation: "Svaka zemlja ima svoje specifične pravila za IBAN"
      })
      return { controlDigits: "", steps, canCalculate: false }
    }

    if (cleanIban.length < 21) {
      const missing = 21 - cleanIban.length
      steps.push({
        description: "Nepotpuni podaci",
        result: `Nedostaje još ${missing} znamenki za potpuni IBAN`,
        type: 'info',
        explanation: "Hrvatski IBAN ima 21 znamenku: HR + 2 kontrolne + 7 kod banke + 10 broj računa"
      })
      return { controlDigits: "", steps, canCalculate: false }
    }

    const countryCode = cleanIban.substring(0, 2)
    const currentControlDigits = cleanIban.substring(2, 4)
    const bankCode = cleanIban.substring(4, 11)
    const accountNumber = cleanIban.substring(11, 21)

    steps.push({
      description: "1. Početni podaci",
      calculation: `Zemlja: ${countryCode}\nKod banke: ${bankCode}\nBroj računa: ${accountNumber}`,
      result: "Imamo sve potrebne komponente",
      type: 'info',
      explanation: "Kontrolne znamenke izračunavamo na temelju ovih podataka"
    })

    const tempIban = `${countryCode}00${bankCode}${accountNumber}`
    steps.push({
      description: "2. Privremeni IBAN s kontrolnim znamenkama '00'",
      calculation: `${countryCode} + 00 + ${bankCode} + ${accountNumber}`,
      result: tempIban,
      type: 'calculation',
      explanation: "Počinjemo s '00' na mjestu kontrolnih znamenki - ovo je standardni korak u algoritmu"
    })

    const rearranged = tempIban.slice(4) + tempIban.slice(0, 4)
    steps.push({
      description: "3. Preuređivanje prema ISO 13616 standardu",
      calculation: `Premjesti prva 4 znaka na kraj:\n'${tempIban.slice(0, 4)}' + '${tempIban.slice(4)}' → '${tempIban.slice(4)}' + '${tempIban.slice(0, 4)}'`,
      result: rearranged,
      type: 'calculation',
      explanation: "Ovaj korak osigurava da se slova (zemlja) obrađuju na kraju algoritma"
    })

    const converted = rearranged.replace(/[A-Z]/g, (c) => (c.charCodeAt(0) - 55).toString())
    steps.push({
      description: "4. Konverzija slova u brojeve",
      calculation: `H → ${("H".charCodeAt(0) - 55)} (A=10, B=11, C=12, ..., H=17)\nR → ${("R".charCodeAt(0) - 55)} (A=10, B=11, C=12, ..., R=27)`,
      result: `${converted.slice(0, 30)}${converted.length > 30 ? '...' : ''}`,
      type: 'calculation',
      explanation: "Svako slovo zamjenjujemo odgovarajućim brojem prema ASCII tablici"
    })

    if (converted.length > 30) {
      steps.push({
        description: "Potpuna konvertirana vrijednost",
        result: converted,
        type: 'info',
        explanation: "Ovo je potpuni broj koji ćemo koristiti za Mod-97 izračun"
      })
    }

    const remainder = modFix(converted, 97)
    steps.push({
      description: "5. Modulo 97 izračun",
      calculation: `${converted} mod 97 = ${remainder}`,
      result: `Ostatak: ${remainder}`,
      type: 'calculation',
      explanation: "Modulo 97 je srce IBAN algoritma - osigurava maksimalnu zaštitu od grešaka"
    })

    const controlDigits = (98 - remainder).toString().padStart(2, '0')
    steps.push({
      description: "6. Izračun kontrolnih znamenki",
      calculation: `98 - ${remainder} = ${98 - remainder}`,
      result: `Kontrolne znamenke: ${controlDigits}`,
      type: 'success',
      explanation: "98 minus ostatak daje kontrolne znamenke. Ako je rezultat jednocifren, dodajemo vodeću nulu."
    })

    const finalIban = `${countryCode}${controlDigits}${bankCode}${accountNumber}`
    steps.push({
      description: "7. Finalni IBAN",
      calculation: `${countryCode} + ${controlDigits} + ${bankCode} + ${accountNumber}`,
      result: finalIban,
      type: 'success',
      explanation: "Ovo je potpuni IBAN s izračunatim kontrolnim znamenkama"
    })

    if (currentControlDigits !== "00" && currentControlDigits !== controlDigits) {
      steps.push({
        description: "8. Usporedba s postojećim IBAN-om",
        calculation: `Izračunato: ${controlDigits}\nU IBAN-u: ${currentControlDigits}`,
        result: currentControlDigits === controlDigits ? "Kontrolne znamenke se poklapaju! ✓" : "Kontrolne znamenke se ne poklapaju! ✗",
        type: currentControlDigits === controlDigits ? 'success' : 'error',
        explanation: currentControlDigits === controlDigits
          ? "Postojeći IBAN ima ispravne kontrolne znamenke"
          : "Postojeći IBAN možda sadrži grešku ili je ovo demonstracija izračuna"
      })
    }

    return { controlDigits, steps, canCalculate: true }
  }

  useEffect(() => {
    const cleanIban = iban.toUpperCase().replace(/\s/g, "")
    setCalculation(calculateControlDigits(cleanIban))
  }, [iban])

  const cleanIban = iban.toUpperCase().replace(/\s/g, "")

  if (cleanIban.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            Izračun kontrolnih znamenki IBAN-a
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground mb-2">Unesite podatke za izračun kontrolnih znamenki</div>
            <div className="text-sm text-muted-foreground">
              Pokazat ćemo kako se od koda banke i broja računa izračunavaju kontrolne znamenke
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="text-xl flex items-center gap-2">
            Izračun kontrolnih znamenki IBAN-a
          </div>
          <div className="flex items-center gap-2">
            {calculation.canCalculate && (
              <Badge variant="default" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                <ArrowRight className="h-3 w-3 mr-1" />
                {calculation.controlDigits}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSteps(!showSteps)}
            >
              {showSteps ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      {showSteps && (
        <CardContent>
          <div className="space-y-3">
            {calculation.steps.map((step, index) => (
              <StepDisplay key={index} step={step} index={index} />
            ))}
          </div>

          {calculation.canCalculate && (
            <div className="mt-6 p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="font-semibold mb-2">Zašto upravo ovaj algoritam?</div>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Mod-97 algoritam</strong> može detektirati 99.97% grešaka u tipkanju</li>
                    <li>• <strong>Preuređivanje</strong> osigurava da se zemlja provjerava u algoritmu</li>
                    <li>• <strong>Konverzija slova</strong> omogućuje matematičku obradu tekstualnih kodova</li>
                    <li>• <strong>Dvije znamenke</strong> pružaju dovoljnu zaštitu bez pretjerane složenosti</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// IBAN Validation Component
function IBANValidationDisplay({ iban }: { iban: string }) {
  const [showSteps, setShowSteps] = useState(true)
  const [validation, setValidation] = useState<DetailedValidationResult>({
    isValid: false,
    steps: [],
    summary: ""
  })

  const validateIBANDetailed = (ibanInput: string): DetailedValidationResult => {
    const steps: ValidationStep[] = []
    const cleanIban = ibanInput.toUpperCase().replace(/\s/g, "")

    if (cleanIban.length === 0) {
      steps.push({
        description: "Čekamo IBAN unos",
        result: "Unesite IBAN da počne validacija",
        type: 'info',
        explanation: "Algoritam Mod-97 će provjeriti ispravnost kada unesete IBAN"
      })
      return { isValid: false, steps, summary: "Čekam" }
    }

    steps.push({
      description: "1. Početni IBAN",
      result: cleanIban,
      type: 'info',
      explanation: "Uklanjamo sve razmake i pretvaramo u velika slova"
    })

    if (cleanIban.length < 4) {
      steps.push({
        description: "2. Provjera minimalne duljine",
        result: `Duljina: ${cleanIban.length} (minimum 4 znakova potrebno)`,
        type: 'error',
        explanation: "IBAN mora imati barem zemljopisni kod i kontrolne znamenke"
      })
      return { isValid: false, steps, summary: "Kratak" }
    }

    if (cleanIban.length !== 21) {
      steps.push({
        description: "2. Provjera duljine",
        result: `${cleanIban.length}/21 znakova`,
        type: cleanIban.length === 21 ? 'success' : 'error',
        explanation: "Hrvatski IBAN mora imati točno 21 znak"
      })
      if (cleanIban.length !== 21) {
        return { isValid: false, steps, summary: "Kratak" }
      }
    } else {
      steps.push({
        description: "2. Provjera duljine",
        result: "21/21 znakova ✓",
        type: 'success',
        explanation: "Duljina je ispravna za hrvatski IBAN"
      })
    }

    if (!cleanIban.startsWith("HR")) {
      steps.push({
        description: "3. Provjera zemlje",
        result: `Počinje s: '${cleanIban.substring(0, 2)}' (mora biti 'HR')`,
        type: 'error',
        explanation: "Kod zemlje mora biti 'HR' za hrvatske bankovne račune"
      })
      return { isValid: false, steps, summary: "Neispravna zemlja" }
    } else {
      steps.push({
        description: "3. Provjera zemlje",
        result: "Počinje s 'HR' ✓",
        type: 'success',
        explanation: "Kod zemlje je ispravan za Hrvatsku"
      })
    }

    // Step 4: Rearrange - move first 4 characters to the end
    const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4)
    steps.push({
      description: "4. Preuređivanje prema ISO 13616",
      calculation: `Premjesti prvih 4 znakova na kraj:\n'${cleanIban.slice(0, 4)}' + '${cleanIban.slice(4)}' → '${cleanIban.slice(4)}' + '${cleanIban.slice(0, 4)}'`,
      result: rearranged,
      type: 'calculation',
      explanation: "Ovo je standardni korak u Mod-97 algoritmu - zemlje kod i kontrolne znamenke idu na kraj"
    })

    // Step 5: Convert letters to numbers (A=10, B=11, ..., Z=35)
    const converted = rearranged.replace(/[A-Z]/g, (c) => (c.charCodeAt(0) - 55).toString())
    steps.push({
      description: "5. Konverzija slova u brojeve",
      calculation: `H → ${("H".charCodeAt(0) - 55)} (A=10, B=11, C=12, ..., H=17)\nR → ${("R".charCodeAt(0) - 55)} (A=10, B=11, C=12, ..., R=27)`,
      result: `${converted.slice(0, 30)}${converted.length > 30 ? '...' : ''}`,
      type: 'calculation',
      explanation: "Svako slovo zamjenjujemo brojem: A=10, B=11, C=12, itd."
    })

    if (converted.length > 30) {
      steps.push({
        description: "Potpuna konvertirana vrijednost",
        result: converted,
        type: 'info',
        explanation: "Ovo je potpuni broj koji ćemo koristiti za Mod-97 izračun"
      })
    }

    // Step 6: Calculate mod 97 using efficient algorithm
    const mod = modFix(converted, 97)
    steps.push({
      description: "6. Modulo 97 izračun",
      calculation: `${converted} mod 97 = ${mod}`,
      result: `Ostatak: ${mod}`,
      type: 'calculation',
      explanation: "Koristimo napredni algoritam koji sprječava prekoračenje brojeva pri velikim vrijednostima"
    })

    const isValid = mod === 1
    steps.push({
      description: "7. Finalna provjera",
      result: isValid ? "Ostatak = 1 → IBAN je OK ✓" : `Ostatak = ${mod} → IBAN nije OK ✗`,
      type: isValid ? 'success' : 'error',
      explanation: isValid
        ? "Mod-97 algoritam potvrđuje da je IBAN matematički ispravan!"
        : "Prema Mod-97 algoritmu, ovaj IBAN sadrži grešku u kontrolnim znamenkama"
    })

    return {
      isValid,
      steps,
      summary: isValid ? "OK" : "Greška"
    }
  }

  useEffect(() => {
    const cleanIban = iban.toUpperCase().replace(/\s/g, "")
    setValidation(validateIBANDetailed(cleanIban))
  }, [iban])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="text-xl lg:text-lg flex items-center gap-2">
            IBAN Validacija
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={validation.isValid ? "default" : "destructive"}>
              {validation.isValid ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {validation.summary}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSteps(!showSteps)}
            >
              {showSteps ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      {showSteps && (
        <CardContent>
          <div className="space-y-3">
            {validation.steps.map((step, index) => (
              <StepDisplay key={index} step={step} index={index} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Bank and Account Validation Component
function BankAccountValidationDisplay({ iban }: { iban: string }) {
  const [showBankSteps, setShowBankSteps] = useState(true)
  const [showAccountSteps, setShowAccountSteps] = useState(true)
  const [bankValidation, setBankValidation] = useState<DetailedValidationResult>({
    isValid: false,
    steps: [],
    summary: ""
  })
  const [accountValidation, setAccountValidation] = useState<DetailedValidationResult>({
    isValid: false,
    steps: [],
    summary: ""
  })

  const validateBankCodeDetailed = (bankCode: string, fullIban: string): DetailedValidationResult => {
    const steps: ValidationStep[] = []

    if (fullIban.length === 0) {
      steps.push({
        description: "Čekamo IBAN unos",
        result: "Unesite IBAN da počne validacija koda banke",
        type: 'info',
        explanation: "Kod banke se izvlači iz pozicija 5-11 IBAN-a"
      })
      return { isValid: false, steps, summary: "Čekam" }
    }

    if (bankCode.length < 7) {
      steps.push({
        description: "Kod banke iz IBAN-a",
        result: bankCode.length > 0 ? `'${bankCode}' (nepotpun)` : "(čekam dovoljno znakova)",
        type: 'info',
        explanation: "Potrebno je unijeti minimalno 11 znakova IBAN-a da se izvuče kod banke"
      })
      steps.push({
        description: "Status",
        result: `Duljina: ${bankCode.length}/7 znamenki`,
        type: 'error',
        explanation: "Hrvatski kod banke mora imati točno 7 znamenki"
      })
      return { isValid: false, steps, summary: "Kratak" }
    }

    steps.push({
      description: "1. Kod banke iz IBAN-a",
      result: `'${bankCode}' (pozicije 5-11)`,
      type: 'info',
      explanation: "Izvlačimo kod banke iz IBAN strukture"
    })

    const baseCode = bankCode.slice(0, 6)
    const controlDigit = bankCode[6]

    steps.push({
      description: "2. Razdijeli kod banke",
      calculation: `'${bankCode}' = '${baseCode}' + '${controlDigit}'`,
      result: `6 osnovnih znamenki + 1 kontrolna`,
      type: 'calculation',
      explanation: "Zadnja znamenka koda banke je kontrolna znamenka"
    })

    // Croatian bank code validation algorithm with detailed steps
    let remainder = 10
    steps.push({
      description: "3. Inicijalizacija algoritma",
      result: "ostatak = 10",
      type: 'calculation',
      explanation: "Hrvatski algoritam počinje s vrijednošću 10"
    })

    for (let i = 0; i < baseCode.length; i++) {
      const digit = Number.parseInt(baseCode[i])
      const oldRemainder = remainder

      // Step: Add digit
      remainder += digit
      const afterAdd = remainder

      // Step: Mod 10 (with special rule: if 0, then 10)
      remainder = remainder % 10 || 10
      const afterMod10 = remainder

      // Step: Multiply by 2
      remainder *= 2
      const afterMul2 = remainder

      // Step: Mod 11
      remainder = remainder % 11
      const finalRemainder = remainder

      steps.push({
        description: `Korak ${i + 1}: Obradi znamenku '${digit}'`,
        calculation: `${oldRemainder} + ${digit} = ${afterAdd}\n${afterAdd} mod 10 = ${afterMod10} ${afterMod10 === afterAdd ? '' : '(ili 10 ako je 0)'}\n${afterMod10} × 2 = ${afterMul2}\n${afterMul2} mod 11 = ${finalRemainder}`,
        result: `ostatak = ${finalRemainder}`,
        type: 'calculation',
        explanation: `Procesiramo svaku znamenku kroz specifični hrvatski algoritam: zbroji → mod 10 → pomnoži s 2 → mod 11`
      })
    }

    let calculatedControl = 11 - remainder
    if (calculatedControl === 10) calculatedControl = 0

    steps.push({
      description: "4. Izračun kontrolne znamenke",
      calculation: `11 - ${remainder} = ${11 - remainder}${11 - remainder === 10 ? ' → 0 (specijalno pravilo)' : ''}`,
      result: `izračunata kontrolna = ${calculatedControl}`,
      type: 'calculation',
      explanation: "Kontrolna znamenka = 11 - ostatak, ali ako je rezultat 10, onda je 0"
    })

    const expectedControl = Number.parseInt(controlDigit)
    const isValid = calculatedControl === expectedControl

    steps.push({
      description: "5. Finalna usporedba",
      calculation: `Izračunato: ${calculatedControl}\nU IBAN-u: ${expectedControl}`,
      result: isValid ? "Jednake → Kod banke je OK ✓" : "Različite → Kod banke nije OK ✗",
      type: isValid ? 'success' : 'error',
      explanation: isValid
        ? "Kontrolna znamenka odgovara izračunatoj vrijednosti"
        : "Kontrolna znamenka ne odgovara - greška u tipkanju"
    })

    return {
      isValid,
      steps,
      summary: isValid ? "OK" : ""
    }
  }

  const validateAccountNumberDetailed = (accountNumber: string, fullIban: string): DetailedValidationResult => {
    const steps: ValidationStep[] = []

    if (fullIban.length === 0) {
      steps.push({
        description: "Čekamo IBAN unos",
        result: "Unesite IBAN da počne validacija broja računa",
        type: 'info',
        explanation: "Broj računa se izvlači iz pozicija 12-21 IBAN-a"
      })
      return { isValid: false, steps, summary: "Čekam" }
    }

    if (accountNumber.length < 10) {
      steps.push({
        description: "Broj računa iz IBAN-a",
        result: accountNumber.length > 0 ? `'${accountNumber}' (nepotpun)` : "(čekam dovoljno znakova)",
        type: 'info',
        explanation: "Potrebno je unijeti puni IBAN (21 znak) da se izvuče broj računa"
      })
      steps.push({
        description: "Status",
        result: `Duljina: ${accountNumber.length}/10 znamenki`,
        type: 'error',
        explanation: "Hrvatski broj računa mora imati točno 10 znamenki"
      })
      return { isValid: false, steps, summary: "Kratak" }
    }

    steps.push({
      description: "1. Broj računa iz IBAN-a",
      result: `'${accountNumber}' (pozicije 12-21)`,
      type: 'info',
      explanation: "Izvlačimo broj računa iz IBAN strukture"
    })

    const baseNumber = accountNumber.slice(0, 9)
    const controlDigit = accountNumber[9]

    steps.push({
      description: "2. Razdijeli broj računa",
      calculation: `'${accountNumber}' = '${baseNumber}' + '${controlDigit}'`,
      result: `9 osnovnih znamenki + 1 kontrolna`,
      type: 'calculation',
      explanation: "Zadnja znamenka broja računa je kontrolna znamenka"
    })

    // Croatian account number validation algorithm - identical to bank code
    let remainder = 10
    steps.push({
      description: "3. Inicijalizacija algoritma",
      result: "ostatak = 10",
      type: 'calculation',
      explanation: "Koristimo isti algoritam kao za kod banke"
    })

    for (let i = 0; i < baseNumber.length; i++) {
      const digit = Number.parseInt(baseNumber[i])
      const oldRemainder = remainder

      remainder += digit
      const afterAdd = remainder
      remainder = remainder % 10 || 10
      const afterMod10 = remainder
      remainder *= 2
      const afterMul2 = remainder
      remainder = remainder % 11
      const finalRemainder = remainder

      steps.push({
        description: `Korak ${i + 1}: Obradi znamenku '${digit}'`,
        calculation: `${oldRemainder} + ${digit} = ${afterAdd}\n${afterAdd} mod 10 = ${afterMod10} ${afterMod10 === afterAdd ? '' : '(ili 10 ako je 0)'}\n${afterMod10} × 2 = ${afterMul2}\n${afterMul2} mod 11 = ${finalRemainder}`,
        result: `ostatak = ${finalRemainder}`,
        type: 'calculation',
        explanation: `Isti postupak kao za kod banke: zbroji → mod 10 → pomnoži s 2 → mod 11`
      })
    }

    let calculatedControl = 11 - remainder
    if (calculatedControl === 10) calculatedControl = 0

    steps.push({
      description: "4. Izračun kontrolne znamenke",
      calculation: `11 - ${remainder} = ${11 - remainder}${11 - remainder === 10 ? ' → 0 (specijalno pravilo)' : ''}`,
      result: `izračunata kontrolna = ${calculatedControl}`,
      type: 'calculation',
      explanation: "Kontrolna znamenka = 11 - ostatak, ali ako je rezultat 10, onda je 0"
    })

    const expectedControl = Number.parseInt(controlDigit)
    const isValid = calculatedControl === expectedControl

    steps.push({
      description: "5. Finalna usporedba",
      calculation: `Izračunato: ${calculatedControl}\nU IBAN-u: ${expectedControl}`,
      result: isValid ? "Jednake → Broj računa je OK ✓" : "Različite → Broj računa nije OK ✗",
      type: isValid ? 'success' : 'error',
      explanation: isValid
        ? "Kontrolna znamenka odgovara izračunatoj vrijednosti"
        : "Kontrolna znamenka ne odgovara - možda postoji greška u tipkanju"
    })

    return {
      isValid,
      steps,
      summary: isValid ? "OK" : ""
    }
  }

  useEffect(() => {
    const cleanIban = iban.toUpperCase().replace(/\s/g, "")

    // Extract parts if IBAN is long enough
    if (cleanIban.length >= 11) {
      const bankCode = cleanIban.substring(4, 11)
      setBankValidation(validateBankCodeDetailed(bankCode, cleanIban))
    } else {
      setBankValidation(validateBankCodeDetailed("", cleanIban))
    }

    if (cleanIban.length >= 21) {
      const accountNumber = cleanIban.substring(11, 21)
      setAccountValidation(validateAccountNumberDetailed(accountNumber, cleanIban))
    } else {
      setAccountValidation(validateAccountNumberDetailed("", cleanIban))
    }
  }, [iban])

  return (
    <div className="space-y-4">
      {/* Bank Code Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="text-xl lg:text-lg flex items-center gap-2">
              Validacija banke
            </div>
            <div className="flex items-center">
              <Badge variant={bankValidation.isValid ? "default" : "destructive"}>
                {bankValidation.isValid ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {bankValidation.summary}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBankSteps(!showBankSteps)}
              >
                {showBankSteps ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        {showBankSteps && (
          <CardContent>
            <div className="space-y-3">
              {bankValidation.steps.map((step, index) => (
                <StepDisplay key={index} step={step} index={index} />
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Account Number Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="text-xl lg:text-lg flex items-center gap-2">
              Validacija računa
            </div>
            <div className="flex items-center">
              <Badge variant={accountValidation.isValid ? "default" : "destructive"}>
                {accountValidation.isValid ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {accountValidation.summary}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAccountSteps(!showAccountSteps)}
              >
                {showAccountSteps ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        {showAccountSteps && (
          <CardContent>
            <div className="space-y-3">
              {accountValidation.steps.map((step, index) => (
                <StepDisplay key={index} step={step} index={index} />
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// Validation Summary Component
interface ValidationSummaryProps {
  iban: string
}

function ValidationSummaryCard({ iban }: ValidationSummaryProps) {
  const [validationResults, setValidationResults] = useState({
    iban: false,
    bank: false,
    account: false,
    overall: false
  })

  useEffect(() => {
    const cleanIban = iban.toUpperCase().replace(/\s/g, "")

    if (cleanIban.length !== 21 || !cleanIban.startsWith("HR")) {
      setValidationResults({ iban: false, bank: false, account: false, overall: false })
      return
    }

    // IBAN validation
    const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4)
    const converted = rearranged.replace(/[A-Z]/g, (c) => (c.charCodeAt(0) - 55).toString())
    const ibanValid = modFix(converted, 97) === 1

    // Bank code validation
    const bankCode = cleanIban.substring(4, 11)
    let bankRemainder = 10
    for (let i = 0; i < 6; i++) {
      const digit = Number.parseInt(bankCode[i])
      bankRemainder += digit
      bankRemainder = bankRemainder % 10 || 10
      bankRemainder *= 2
      bankRemainder = bankRemainder % 11
    }
    let bankControl = 11 - bankRemainder
    if (bankControl === 10) bankControl = 0
    const bankValid = bankControl === Number.parseInt(bankCode[6])

    // Account number validation
    const accountNumber = cleanIban.substring(11, 21)
    let accountRemainder = 10
    for (let i = 0; i < 9; i++) {
      const digit = Number.parseInt(accountNumber[i])
      accountRemainder += digit
      accountRemainder = accountRemainder % 10 || 10
      accountRemainder *= 2
      accountRemainder = accountRemainder % 11
    }
    let accountControl = 11 - accountRemainder
    if (accountControl === 10) accountControl = 0
    const accountValid = accountControl === Number.parseInt(accountNumber[9])

    const overall = ibanValid && bankValid && accountValid

    setValidationResults({
      iban: ibanValid,
      bank: bankValid,
      account: accountValid,
      overall
    })
  }, [iban])

  const cleanIban = iban.toUpperCase().replace(/\s/g, "")

  if (cleanIban.length === 0) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-muted-foreground mb-2">
                Unesite IBAN za validaciju
              </h3>
              <p className="text-muted-foreground">
                Sustav će u realnom vremenu analizirati ispravnost
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (cleanIban.length < 21) {
    return (
      <Card className="border-2 border-orange-500/30 bg-orange-500/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Terminal className="h-16 w-16 text-yellow-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-2">
                IBAN u tijeku unosa
              </h3>
              <p className="text-orange-600 dark:text-orange-300">
                Napredak: {cleanIban.length}/21 znakova
              </p>
            </div>
            <div className="w-full bg-orange-100 dark:bg-orange-900/30 rounded-full h-2.5">
              <div
                className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(cleanIban.length / 21) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      validationResults.overall
        ? "border-green-500/50 bg-green-500/5 shadow-lg shadow-green-500/20"
        : "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/20"
    )}>
      <CardContent className="pt-6">
        {validationResults.overall ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-green-700 dark:text-green-300 bg-background rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                🎉 IBAN je ispravan! 🎉
              </h3>
              <p className="text-green-700 dark:text-green-300 text-lg">
                Svi algoritmi potvrđuju ispravnost
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex flex-col items-center space-y-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">IBAN</span>
                <span className="text-xs text-green-600 dark:text-green-400">✓ Valjan</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Kod banke</span>
                <span className="text-xs text-green-600 dark:text-green-400">✓ Valjan</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Broj računa</span>
                <span className="text-xs text-green-600 dark:text-green-400">✓ Valjan</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <AlertTriangle className="h-16 w-16 text-red-600 dark:text-red-400 animate-pulse" />
                <XCircle className="absolute -top-2 -right-2 h-6 w-6 text-red-700 dark:text-red-300 bg-background rounded-full" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
                ⚠️ IBAN sadrži greške ⚠️
              </h3>
              <p className="text-red-700 dark:text-red-300 text-lg">
                Jedan ili više algoritma označava neispravnost
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex flex-col items-center space-y-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                {validationResults.iban ? (
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
                <span className="text-sm font-medium text-foreground">IBAN</span>
                <span className={cn(
                  "text-xs font-medium",
                  validationResults.iban ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {validationResults.iban ? "✓ Valjan" : "✗ Nevaljan"}
                </span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                {validationResults.bank ? (
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
                <span className="text-sm font-medium text-foreground">Kod banke</span>
                <span className={cn(
                  "text-xs font-medium",
                  validationResults.bank ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {validationResults.bank ? "✓ Valjan" : "✗ Nevaljan"}
                </span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                {validationResults.account ? (
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
                <span className="text-sm font-medium text-foreground">Broj računa</span>
                <span className={cn(
                  "text-xs font-medium",
                  validationResults.account ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {validationResults.account ? "✓ Valjan" : "✗ Nevaljan"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const formSchema = paymentFormSchema

export default function PaymentForm() {
  const [barcodeUrl, setBarcodeUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
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

  useEffect(() => {
    const formData: { [key: string]: string } = {}
    searchParams.forEach((value: string, key: string | number) => {
      if (key === 'amount' && value) {
        formData[key] = decodeURIComponent(value);
      } else {
        formData[key] = value;
      }
    })
    if (Object.keys(formData).length > 0) {
      form.reset({
        ...form.getValues(),
        ...formData
      })
    }
  }, [searchParams, form])

  useEffect(() => {
    const savedData = document.cookie
      .split('; ')
      .find(row => row.startsWith('senderData='))
      ?.split('=')[1];

    if (savedData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(savedData));
        form.reset({
          ...form.getValues(),
          ...parsedData
        });
      } catch (e) {
        console.error('Error parsing saved sender data:', e);
      }
    }
  }, []);

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
      } else {
        toast({
          title: "Greška",
          description: "Došlo je do greške prilikom slanja obrasca. Molimo pokušajte ponovno.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Greška",
        description: "Došlo je do neočekivane greške. Molimo pokušajte ponovno.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSenderDataLoad = (data: Partial<PaymentFormData>) => {
    form.reset({
      ...form.getValues(),
      ...data,
    })
  }

  const handleReceiverDataLoad = (data: Partial<PaymentFormData>) => {
    form.reset({
      ...form.getValues(),
      ...data,
    })
  }

  const handleIBANSelect = (iban: string) => {
    form.setValue("iban", iban)
  }

  const handleKeyDownIBAN = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const pressedKey = event.key.toUpperCase()
    const currentValue = event.currentTarget.value
    const cursorPosition = event.currentTarget.selectionStart ?? 0

    const allowedKeys = ["TAB", "BACKSPACE", "DELETE", "ARROWLEFT", "ARROWRIGHT", "F5"]

    if (allowedKeys.includes(pressedKey) || (event.ctrlKey && ["C", "V", "A"].includes(pressedKey))) {
      return
    }
    if (cursorPosition < 2) {
      event.preventDefault()
      if (cursorPosition === 0 && pressedKey === "H") {
        event.currentTarget.value = "H" + currentValue.slice(1)
        event.currentTarget.setSelectionRange(1, 1)
      } else if (cursorPosition === 1 && pressedKey === "R" && currentValue.charAt(0) === "H") {
        event.currentTarget.value = "HR" + currentValue.slice(2)
        event.currentTarget.setSelectionRange(2, 2)
      }
      return
    }
    if (cursorPosition >= 2 && currentValue.length < 21) {
      if (!isNaN(Number(pressedKey))) {
        return
      }
    }
    event.preventDefault()
  }

  const handleKeyDownReference = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const pressedKey = event.key
    const currentValue = event.currentTarget.value
    const cursorPosition = event.currentTarget.selectionStart ?? 0

    const allowedKeys = ["Tab", "Backspace", "Delete", "ArrowLeft", "ArrowRight", "F5"]

    if (allowedKeys.includes(pressedKey) || (event.ctrlKey && ["c", "v", "a"].includes(pressedKey.toLowerCase()))) {
      return
    }

    if (pressedKey === "-") {
      const hyphenCount = currentValue.split("-").length - 1

      if (cursorPosition === 0 || currentValue[cursorPosition - 1] === "-" || hyphenCount >= 2) {
        event.preventDefault()
        return
      }
      return
    }

    if (pressedKey.match(/^\d$/)) {
      if (currentValue.length >= 22) {
        event.preventDefault()
        return
      }

      const parts = currentValue.split("-")
      let accumulatedLength = 0
      let segmentIndex = -1

      for (let i = 0; i < parts.length; i++) {
        if (cursorPosition <= accumulatedLength + parts[i].length) {
          segmentIndex = i
          break
        }
        accumulatedLength += parts[i].length + 1
      }

      if (segmentIndex !== -1) {
        const segment = parts[segmentIndex]
        const beforeCursor = segment.substring(0, cursorPosition - accumulatedLength)
        const afterCursor = segment.substring(cursorPosition - accumulatedLength)
        if ((beforeCursor + pressedKey + afterCursor).match(/^\d{13,}$/)) {
          event.preventDefault()
          return
        }
      }
    } else {
      event.preventDefault()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedContent = event.clipboardData.getData("text/plain")
    const currentValue = event.currentTarget.value
    const selectionStart = event.currentTarget.selectionStart ?? 0
    const selectionEnd = event.currentTarget.selectionEnd ?? 0

    const newValue = currentValue.substring(0, selectionStart) + pastedContent + currentValue.substring(selectionEnd)

    const ibanPattern = /^HR\d{19}$/

    if (!ibanPattern.test(newValue) || newValue.length > 21) {
      event.preventDefault()
    }
  }

  const createBarcodeCanvas = async (barcodeUrl: string): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const padding = 4;
        const canvas = document.createElement("canvas");
        canvas.width = img.width + (padding * 2);
        canvas.height = img.height + (padding * 2);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, padding, padding, img.width, img.height);

        resolve(canvas);
      };
      img.onerror = () => reject(new Error("Failed to load barcode image"));
      img.src = barcodeUrl;
    });
  };

  const handleDownload = async () => {
    if (barcodeUrl) {
      try {
        const canvas = await createBarcodeCanvas(barcodeUrl);

        canvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            toast({
              title: "Error",
              description: "Failed to create image blob.",
              variant: "destructive",
            });
            return;
          }

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = "barcode-with-background.png";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, "image/png");
      } catch (error) {
        console.error("Error downloading barcode:", error);
        toast({
          title: "Error",
          description: "Failed to download the barcode.",
          variant: "destructive",
        });
      }
    }
  };

  const handleShare = async () => {
    if (!barcodeUrl) {
      toast({
        title: "Error",
        description: "No barcode has been generated yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = await createBarcodeCanvas(barcodeUrl);

      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          toast({
            title: "Error",
            description: "Failed to create image blob.",
            variant: "destructive",
          });
          return;
        }

        const file = new File([blob], "hub3-barkod.png", { type: "image/png" });

        if (navigator.share) {
          try {
            await navigator.share({
              files: [file],
              title: "HUB3 Barcode",
              text: "HUB3 barkod",
            });
          } catch (error) {
            console.error("Error sharing:", error);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = "hub3-barkod.png";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } else {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = "hub3-barkod.png";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: "Info",
            description: "Your browser doesn't support direct sharing. The barcode has been downloaded instead.",
          });
        }
      }, "image/png");
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Error",
        description: "Failed to share the barcode.",
        variant: "destructive",
      });
    }
  };

  const fillDummyData = () => {
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
  }

  const resetForm = () => {
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
  }

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

          {/* IBAN Structure Analysis */}
          <IBANStructureDisplay iban={form.watch("iban")} />

          {/* IBAN Control Digit Calculator */}
          <IBANControlDigitCalculator iban={form.watch("iban")} />

          {/* IBAN Validation Analysis */}
          <IBANValidationDisplay iban={form.watch("iban")} />
        </div>

        {/* Center - Main Form */}
        <Card className="w-full max-w-2xl mx-auto bg-background">
          <CardHeader>
            <CardTitle className="text-center">Barkod za plaćanje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-4 mb-6">
              <Button onClick={fillDummyData} className="hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                <LuPlay className="mr-2 h-4 w-4" /> Demo
              </Button>
              <Button onClick={resetForm} className="hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                <LuX className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Platitelj Section */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Platitelj</h2>
                    <FormField
                      control={form.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ime i prezime <span className="text-sm text-muted-foreground/50">max 30</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="npr. Pero Perić" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={30} {...field} />
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
                            Ulica i kućni broj <span className="text-sm text-muted-foreground/50">max 27</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="npr. Nikole Tesle 1" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={27} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <PlaceLookup section="sender" form={form} />
                  </div>

                  {/* Primatelj Section */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Primatelj</h2>
                    <FormField
                      control={form.control}
                      name="receiverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ime i prezime <span className="text-sm text-muted-foreground/50">max 25</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="npr. Ana Anić" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={25} {...field} />
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
                            Ulica i kućni broj <span className="text-sm text-muted-foreground/50">max 25</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="npr. Stjepana Radića 2" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={25} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <PlaceLookup section="receiver" form={form} />
                  </div>
                </div>

                {/* IBAN Calculator */}
                <IBANCalculator onIBANSelect={handleIBANSelect} />

                {/* Uplata Section */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Uplata</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="iban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              IBAN <span className="text-sm text-muted-foreground/50">21</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onKeyDown={handleKeyDownIBAN}
                                onPaste={handlePaste}
                                placeholder="HR1234567890123456789"
                                maxLength={21}
                                className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>
                            Iznos <span className="text-sm text-muted-foreground/50">0 - 9.999,99</span>
                          </FormLabel>
                          <AmountInput field={field} error={!!fieldState.error} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow">
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
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="reference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Poziv na broj <span className="text-sm text-muted-foreground/50">max 22</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onKeyDown={handleKeyDownReference}
                                placeholder="123-456-789"
                                maxLength={22}
                                className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Namjena</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow">
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Opis plaćanja <span className="text-sm text-muted-foreground/50">max 35</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="npr. plaćanje računa" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={35} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Overall Validation Summary */}
                <ValidationSummaryCard iban={form.watch("iban")} />

                <div className="flex justify-center">
                  <Button type="submit" className="w-full hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500 animate-bounce" disabled={isLoading}>
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
                    <Button onClick={handleDownload} className="hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                      <LuDownload className="mr-2 h-4 w-4" /> Preuzmi
                    </Button>
                    <Button onClick={handleShare} className="hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                      <LuShare2 className="mr-2 h-4 w-4" /> Podijeli
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <FormLinkComponent watch={form.watch} />
          </CardContent>
          {isLoading && <LoadingSpinner />}
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

          {/* Bank Code & Account Number Validation */}
          <BankAccountValidationDisplay iban={form.watch("iban")} />
        </div>
      </div>

      {/* Mobile/tablet layout: stacked */}
      <div className="xl:hidden">
        <Card className="w-full max-w-2xl mx-auto bg-background">
          <CardHeader>
            <CardTitle className="text-center">Barkod za plaćanje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-4 mb-6">
              <Button onClick={fillDummyData} className="hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                <LuPlay className="mr-2 h-4 w-4" /> Demo
              </Button>
              <Button onClick={resetForm} className="hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                <LuX className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Platitelj Section */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Platitelj</h2>
                    <FormField
                      control={form.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ime i prezime <span className="text-sm text-muted-foreground/50">max 30</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="npr. Pero Perić" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={30} {...field} />
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
                            Ulica i kućni broj <span className="text-sm text-muted-foreground/50">max 27</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="npr. Nikole Tesle 1" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={27} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <PlaceLookup section="sender" form={form} />
                  </div>

                  {/* Primatelj Section */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Primatelj</h2>
                    <FormField
                      control={form.control}
                      name="receiverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ime i prezime <span className="text-sm text-muted-foreground/50">max 25</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="npr. Ana Anić" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={25} {...field} />
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
                            Ulica i kućni broj <span className="text-sm text-muted-foreground">max 25</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="npr. Stjepana Radića 2" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={25} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <PlaceLookup section="receiver" form={form} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EnhancedDataManager
                    type="sender"
                    currentData={{
                      senderName: form.getValues("senderName"),
                      senderStreet: form.getValues("senderStreet"),
                      senderPostcode: form.getValues("senderPostcode"),
                      senderCity: form.getValues("senderCity"),
                    }}
                    onDataLoad={handleSenderDataLoad}
                  />
                  <EnhancedDataManager
                    type="receiver"
                    currentData={{
                      receiverName: form.getValues("receiverName"),
                      receiverStreet: form.getValues("receiverStreet"),
                      receiverPostcode: form.getValues("receiverPostcode"),
                      receiverCity: form.getValues("receiverCity"),
                      iban: form.getValues("iban"),
                    }}
                    onDataLoad={handleReceiverDataLoad}
                  />
                </div>

                {/* IBAN Calculator */}
                <IBANCalculator onIBANSelect={handleIBANSelect} />

                {/* Uplata Section */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Uplata</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="iban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              IBAN <span className="text-sm text-muted-foreground">21</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onKeyDown={handleKeyDownIBAN}
                                onPaste={handlePaste}
                                placeholder="HR1234567890123456789"
                                maxLength={21}
                                className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>
                            Iznos <span className="text-sm text-muted-foreground">0 - 9.999,99</span>
                          </FormLabel>
                          <AmountInput field={field} error={!!fieldState.error} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow">
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
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="reference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Poziv na broj <span className="text-sm text-muted-foreground">max 22</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onKeyDown={handleKeyDownReference}
                                placeholder="123-456-789"
                                maxLength={22}
                                className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Namjena</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow">
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Opis plaćanja <span className="text-sm text-muted-foreground">max 35</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="npr. plaćanje računa" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={35} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Overall Validation Summary - Always show */}
                <ValidationSummaryCard iban={form.watch("iban")} />

                <div className="flex justify-center">
                  <Button type="submit" className="w-full hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500 animate-bounce" disabled={isLoading}>
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
                    <Button onClick={handleDownload} className="hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                      <LuDownload className="mr-2 h-4 w-4" /> Preuzmi
                    </Button>
                    <Button onClick={handleShare} className="hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                      <LuShare2 className="mr-2 h-4 w-4" /> Podijeli
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <FormLinkComponent watch={form.watch} />
          </CardContent>
          {isLoading && <LoadingSpinner />}
        </Card>

        {/* MOBILE VALIDATION SECTION - Always visible */}
        <div className="mt-8 space-y-6 max-w-2xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">IBAN Analiza u Realnom Vremenu</h2>
            <p className="text-muted-foreground mb-6">Kompletnu analizu strukture, izračuna i validacije</p>
          </div>

          {/* IBAN Structure - Always show */}
          <IBANStructureDisplay iban={form.watch("iban")} />

          {/* IBAN Control Digit Calculator - Always show */}
          <IBANControlDigitCalculator iban={form.watch("iban")} />

          {/* IBAN Validation - Always show */}
          <IBANValidationDisplay iban={form.watch("iban")} />

          {/* Bank & Account Validation - Always show */}
          <BankAccountValidationDisplay iban={form.watch("iban")} />

          {/* Educational Note */}
          <Card className="border-2 border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-blue-800 dark:text-blue-200">
                  <span className="text-lg font-bold">
                    💡 Sustav koristi CBS algoritme
                  </span>
                  <p className="my-4 text-sm text-blue-600 dark:text-blue-300">
                    Svi izračuni se izvršavaju u realnom vremenu dok tipkate:
                  </p>
                  <ul className="list-disc mt-2 text-xs text-blue-600 dark:text-blue-300 space-y-1 text-left">
                    <li><strong>Struktura IBAN-a</strong> - razloženi prikaz svih komponenti</li>
                    <li><strong>Izračun kontrolnih znamenki</strong> - kako se generiraju</li>
                    <li><strong>Mod-97 validacija</strong> - provjera ispravnosti postojećeg IBAN-a</li>
                    <li><strong>Validacija banke i računa</strong> - provjera unutarnjih kontrolnih znamenki</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}