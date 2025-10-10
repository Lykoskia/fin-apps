/* "use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Calculator, CreditCard, Building2, AlertCircle, Eye, EyeOff, Award, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
export function IBANStructureDisplay({ iban }: { iban: string }) {
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
        <div className="font-mono text-lg space-y-2">
          <div className="flex flex-wrap gap-1">
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded font-bold border border-blue-500/20">
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
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500/20 border border-blue-500/30 rounded"></div>
            <span className="font-semibold text-blue-600 dark:text-blue-400">HR</span> 
            <span className="text-muted-foreground">- Zemljopisni kod (Hrvatska)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/30 rounded"></div>
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">{cleanIban.substring(2, 4) || "__"}</span> 
            <span className="text-muted-foreground">- IBAN kontrolne znamenke</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500/20 border border-green-500/30 rounded"></div>
            <span className="font-semibold text-green-600 dark:text-green-400">{cleanIban.substring(4, 11) || "_______"}</span> 
            <span className="text-muted-foreground">- Kod banke (7 znamenki)</span>
          </div>
          <div className="flex items-center gap-2">
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
          <CreditCard className="h-5 w-5" />
          Struktura IBAN-a
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formatIBANDisplay(iban)}
      </CardContent>
    </Card>
  )
}

// IBAN Validation Component
export function IBANValidationDisplay({ iban }: { iban: string }) {
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
      return { isValid: false, steps, summary: "Čekam IBAN" }
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
      return { isValid: false, steps, summary: "Prekratak IBAN" }
    }
    
    if (cleanIban.length !== 21) {
      steps.push({
        description: "2. Provjera duljine",
        result: `${cleanIban.length}/21 znakova`,
        type: cleanIban.length === 21 ? 'success' : 'error',
        explanation: "Hrvatski IBAN mora imati točno 21 znak"
      })
      if (cleanIban.length !== 21) {
        return { isValid: false, steps, summary: "Neispravna duljina" }
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
      result: isValid ? "Ostatak = 1 → IBAN je valjan ✓" : `Ostatak = ${mod} → IBAN nije valjan ✗`,
      type: isValid ? 'success' : 'error',
      explanation: isValid 
        ? "Mod-97 algoritam potvrđuje da je IBAN matematički ispravan!" 
        : "Prema Mod-97 algoritmu, ovaj IBAN sadrži grešku u kontrolnim znamenkama"
    })
    
    return { 
      isValid, 
      steps, 
      summary: isValid ? "Valjan IBAN" : "Nevaljan IBAN" 
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
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            IBAN Validacija (Mod-97 algoritam)
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
export function BankAccountValidationDisplay({ iban }: { iban: string }) {
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
      return { isValid: false, steps, summary: "Čekam IBAN" }
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
      return { isValid: false, steps, summary: "Nepotpun kod" }
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
      result: isValid ? "Jednake → Kod banke je valjan ✓" : "Različite → Kod banke nije valjan ✗",
      type: isValid ? 'success' : 'error',
      explanation: isValid 
        ? "Kontrolna znamenka odgovara izračunatoj vrijednosti"
        : "Kontrolna znamenka ne odgovara - možda postoji greška u tipkanju"
    })
    
    return { 
      isValid, 
      steps, 
      summary: isValid ? "Valjan kod banke" : "Nevaljan kod banke" 
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
      return { isValid: false, steps, summary: "Čekam IBAN" }
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
      return { isValid: false, steps, summary: "Nepotpun broj" }
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
      summary: isValid ? "Valjan" : "Nevaljan" 
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Validacija koda banke
            </div>
            <div className="flex items-center gap-2">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Validacija broja računa
            </div>
            <div className="flex items-center gap-2">
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

export function ValidationSummaryCard({ iban }: ValidationSummaryProps) {
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
              <AlertTriangle className="h-16 w-16 text-orange-500" />
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
                <Award className="h-16 w-16 text-green-600 dark:text-green-400 animate-pulse" />
                <CheckCircle className="absolute -top-2 -right-2 h-6 w-6 text-green-700 dark:text-green-300 bg-background rounded-full" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                🎉 IBAN je potpuno valjan! 🎉
              </h3>
              <p className="text-green-700 dark:text-green-300 text-lg">
                Svi algoritmi potvrđuju ispravnost
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex flex-col items-center space-y-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">IBAN Mod-97</span>
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
                <span className="text-sm font-medium text-foreground">IBAN Mod-97</span>
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

*/