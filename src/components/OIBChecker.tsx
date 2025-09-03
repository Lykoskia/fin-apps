"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Lightbulb, Terminal, Calculator, Shield } from "lucide-react"
import { LuTestTube, LuRotateCcw } from "react-icons/lu"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ValidationStep {
  description: string
  calculation?: string
  result?: string
  type: 'info' | 'calculation' | 'success' | 'error'
  explanation?: string
}

interface OIBValidationResult {
  isValid: boolean
  controlDigit?: number
  steps: ValidationStep[]
  summary: string
}

const StepDisplay = ({ step }: { step: ValidationStep; index: number }) => (
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
      <div className="font-mono text-xs text-muted-foreground bg-muted p-2 rounded border break-all">
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

const OIBStructureDisplay: React.FC<{ oib: string }> = ({ oib }) => {
  const [showDetails, setShowDetails] = useState(true);
  
  const analyzeOIB = (oibValue: string) => {
    const cleanOib = oibValue.replace(/\D/g, '');
    const parts: ValidationStep[] = [];
    
    if (cleanOib.length === 0) {
      return { parts };
    }

    if (cleanOib.length >= 10) {
      parts.push({
        description: "Osnovni broj",
        result: cleanOib.substring(0, 10),
        type: cleanOib.length >= 10 ? 'info' : 'error',
        explanation: "Prvih 10 znamenki - osnovni identifikacijski broj"
      });
    }

    if (cleanOib.length === 11) {
      parts.push({
        description: "Kontrolna znamenka",
        result: cleanOib.substring(10, 11),
        type: 'info',
        explanation: "11. znamenka - kontrolna znamenka za provjeru ispravnosti"
      });
    }

    return { parts };
  };

  const { parts } = analyzeOIB(oib);

  if (!oib || oib.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Struktura OIB-a
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Unesite OIB da vidite strukturu...</div>
            <div className="mt-2 text-sm text-muted-foreground">Format: 10 osnovnih znamenki + 1 kontrolna znamenka</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Struktura OIB-a
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 w-6 p-0"
          >
            {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      {showDetails && (
        <CardContent className="pt-0 space-y-3">
          {parts.map((part, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-sm font-medium text-foreground">{part.description}</span>
                  <div className="text-xs text-muted-foreground">{part.explanation}</div>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {part.result}
              </Badge>
            </div>
          ))}
          
          {parts.length > 0 && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded mt-4">
              <strong>Napomena:</strong> OIB (Osobni identifikacijski broj) je jedinstven 11-znamenkasti broj koji se dodjeljuje svakoj osobi u Hrvatskoj.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

const OIBControlDigitCalculator: React.FC<{ oib: string }> = ({ oib }) => {
  const [showDetails, setShowDetails] = useState(false);

  const calculateControlDigit = (oibValue: string): ValidationStep[] => {
    const steps: ValidationStep[] = [];
    const cleanOib = oibValue.replace(/\D/g, '');

    if (cleanOib.length === 0) {
      steps.push({
        description: "Čekamo OIB unos",
        result: "Unesite najmanje 10 znamenki za izračun kontrolne znamenke",
        type: 'info',
        explanation: "Kontrolna znamenka se izračunava iz prvih 10 znamenki OIB-a"
      });
      return steps;
    }

    if (cleanOib.length < 10) {
      steps.push({
        description: "Nepotpuni podaci",
        result: `Nedostaje još ${10 - cleanOib.length} znamenki`,
        type: 'error',
        explanation: "Trebamo svih 10 osnovnih znamenki za izračun kontrolne znamenke"
      });
      return steps;
    }

    const baseNumber = cleanOib.substring(0, 10);
    
    steps.push({
      description: "1. Osnovni broj",
      result: baseNumber,
      type: 'info',
      explanation: "Prvih 10 znamenki OIB-a iz kojih izračunavamo kontrolnu znamenku"
    });

    // Croatian OIB algorithm
    let a = 10;
    const digitCalculations: string[] = [];

    for (let i = 0; i < 10; i++) {
      const digit = parseInt(baseNumber[i]);
      const oldA = a;
      
      a = a + digit;
      const afterAdd = a;
      
      a = a % 10;
      if (a === 0) a = 10;
      const afterMod = a;
      
      a = (a * 2) % 11;
      const afterMul = a;
      
      digitCalculations.push(`Korak ${i + 1}: a=${oldA} + ${digit} = ${afterAdd} → mod 10 = ${afterMod} → ×2 mod 11 = ${afterMul}`);
    }

    steps.push({
      description: "2. Postupni izračun kroz znamenke",
      calculation: digitCalculations.join('\n'),
      result: `Finalna vrijednost a = ${a}`,
      type: 'calculation',
      explanation: "Za svaku znamenku: a = ((a + znamenka) mod 10 ili 10) × 2 mod 11"
    });

    let controlDigit = 11 - a;
    if (controlDigit === 10 || controlDigit === 11) {
      controlDigit = 0;
    }

    steps.push({
      description: "3. Izračun kontrolne znamenke",
      calculation: `11 - ${a} = ${11 - a}${(11 - a >= 10) ? ' → 0 (jer je ≥ 10)' : ''}`,
      result: controlDigit.toString(),
      type: 'success',
      explanation: "Kontrolna znamenka = 11 - a, ali ako je rezultat ≥ 10, onda je 0"
    });

    const fullOib = baseNumber + controlDigit;
    steps.push({
      description: "4. Potpuni OIB",
      result: fullOib,
      type: 'success',
      explanation: "10 osnovnih znamenki + kontrolna znamenka"
    });

    if (cleanOib.length === 11) {
      const inputControlDigit = parseInt(cleanOib[10]);
      const isMatch = controlDigit === inputControlDigit;
      
      steps.push({
        description: "5. Usporedba s unesenim OIB-om",
        calculation: `Izračunato: ${controlDigit}\nUneseno: ${inputControlDigit}`,
        result: isMatch ? "Kontrolne znamenke se poklapaju! ✓" : "Kontrolne znamenke se ne poklapaju! ✗",
        type: isMatch ? 'success' : 'error',
        explanation: isMatch ? "OIB je ispravan" : "OIB sadrži grešku"
      });
    }

    return steps;
  };

  const steps = calculateControlDigit(oib);
  const cleanOib = oib.replace(/\D/g, '');
  const hasValidData = cleanOib.length >= 10;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Izračun kontrolne znamenke
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 w-6 p-0"
            disabled={!hasValidData}
          >
            {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      {showDetails && (
        <CardContent className="pt-0 space-y-3">
          {steps.map((step, index) => (
            <StepDisplay key={index} step={step} index={index} />
          ))}
          
          {hasValidData && (
            <div className="mt-6 p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="font-semibold mb-2">Zašto upravo ovaj algoritam?</div>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Modulo 11 algoritam</strong> pruža visoku razinu zaštite od grešaka</li>
                    <li>• <strong>Postupno ažuriranje</strong> osigurava da svaka znamenka utječe na rezultat</li>
                    <li>• <strong>Standardizirani postupak</strong> koristi se u hrvatskom javnom sustavu</li>
                    <li>• <strong>Jednostavan za provjeru</strong> ali teško za falsificiranje</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

const OIBValidationDisplay: React.FC<{ oib: string }> = ({ oib }) => {
  const [showSteps, setShowSteps] = useState(true);
  
  const validateOIBDetailed = (oibValue: string): OIBValidationResult => {
    const steps: ValidationStep[] = [];
    const cleanOib = oibValue.replace(/\D/g, '');

    if (cleanOib.length === 0) {
      steps.push({
        description: "Čekamo OIB unos",
        result: "Unesite OIB da počne validacija",
        type: 'info',
        explanation: "Hrvatski algoritam će provjeriti ispravnost kad unesete OIB"
      });
      return { isValid: false, steps, summary: "Čekam" };
    }

    steps.push({
      description: "1. Početni OIB",
      result: cleanOib,
      type: 'info',
      explanation: "Uklanjamo sve što nije broj"
    });

    if (cleanOib.length !== 11) {
      steps.push({
        description: "2. Provjera duljine",
        result: `${cleanOib.length}/11 znamenki`,
        type: 'error',
        explanation: "OIB mora imati točno 11 znamenki"
      });
      return { isValid: false, steps, summary: "Pogrešna duljina" };
    }

    steps.push({
      description: "2. Provjera duljine",
      result: "11/11 znamenki ✓",
      type: 'success',
      explanation: "Duljina je ispravna"
    });

    // Validate using Croatian algorithm
    const baseNumber = cleanOib.substring(0, 10);
    let a = 10;

    for (let i = 0; i < 10; i++) {
      const digit = parseInt(baseNumber[i]);
      a = a + digit;
      a = a % 10;
      if (a === 0) a = 10;
      a = (a * 2) % 11;
    }

    let expectedControlDigit = 11 - a;
    if (expectedControlDigit === 10 || expectedControlDigit === 11) {
      expectedControlDigit = 0;
    }

    const actualControlDigit = parseInt(cleanOib[10]);
    const isControlDigitValid = expectedControlDigit === actualControlDigit;

    steps.push({
      description: "3. Algoritam kontrolne znamenke",
      calculation: `Osnovni broj: ${baseNumber}\nIzračunata kontrolna: ${expectedControlDigit}\nUnesena kontrolna: ${actualControlDigit}`,
      result: isControlDigitValid ? "Kontrolna znamenka je ispravna ✓" : "Kontrolna znamenka nije ispravna ✗",
      type: isControlDigitValid ? 'success' : 'error',
      explanation: isControlDigitValid ? "OIB je matematički ispravan" : "OIB sadrži grešku u kontrolnoj znamenci"
    });

    return {
      isValid: isControlDigitValid,
      controlDigit: expectedControlDigit,
      steps,
      summary: isControlDigitValid ? "Ispravan" : "Neispravan"
    };
  };

  const validationResults = validateOIBDetailed(oib);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {validationResults.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            OIB validacija
            <Badge variant={validationResults.isValid ? 'default' : 'destructive'} className="ml-auto text-xs">
              {validationResults.summary}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSteps(!showSteps)}
            className="h-6 w-6 p-0"
          >
            {showSteps ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      {showSteps && (
        <CardContent className="pt-0 space-y-3">
          {validationResults.steps.map((step, index) => (
            <StepDisplay key={index} step={step} index={index} />
          ))}
        </CardContent>
      )}
    </Card>
  );
};

const ValidationSummaryCard: React.FC<{ oib: string }> = ({ oib }) => {
  const cleanOib = oib.replace(/\D/g, '');
  
  const validateOIB = (oibValue: string): boolean => {
    if (oibValue.length !== 11) return false;
    
    let a = 10;
    for (let i = 0; i < 10; i++) {
      const digit = parseInt(oibValue[i]);
      a = a + digit;
      a = a % 10;
      if (a === 0) a = 10;
      a = (a * 2) % 11;
    }
    
    let controlDigit = 11 - a;
    if (controlDigit === 10 || controlDigit === 11) {
      controlDigit = 0;
    }
    
    return controlDigit === parseInt(oibValue[10]);
  };

  const isValid = cleanOib.length === 11 ? validateOIB(cleanOib) : false;

  if (cleanOib.length === 0) {
    return (
      <Card className="w-full border-2 border-muted">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-muted-foreground mb-2">
                Unesite OIB za provjeru
              </h3>
              <p className="text-muted-foreground">
                Sustav će analizirati ispravnost OIB-a u realnom vremenu
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cleanOib.length < 11) {
    return (
      <Card className="w-full border-2 border-orange-500/30 bg-orange-500/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Terminal className="h-16 w-16 text-yellow-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-2">
                OIB u tijeku unosa
              </h3>
              <p className="text-orange-600 dark:text-orange-300">
                Napredak: {cleanOib.length}/11 znamenki
              </p>
            </div>
            <div className="w-full bg-orange-100 dark:bg-orange-900/30 rounded-full h-2.5">
              <div
                className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(cleanOib.length / 11) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "w-full border-2 transition-all duration-300",
      isValid
        ? "border-green-500/50 bg-green-500/5 shadow-lg shadow-green-500/20"
        : "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/20"
    )}>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {isValid ? (
              <CheckCircle className="h-16 w-16 text-green-700 dark:text-green-300 animate-pulse" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600 dark:text-red-400 animate-pulse" />
            )}
          </div>
          <div>
            <h3 className={cn(
              "text-2xl font-bold mb-2",
              isValid ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
            )}>
              {isValid ? "OIB je ispravan!" : "OIB nije ispravan!"}
            </h3>
            <p className={cn(
              "text-lg",
              isValid ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
            )}>
              {isValid 
                ? "Kontrolna znamenka je matematički ispravna" 
                : "Kontrolna znamenka ne odgovara algoritmu"
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function OIBChecker() {
  const [oib, setOib] = useState("");
  const [baseDigits, setBaseDigits] = useState("");
  const [generatedControlDigit, setGeneratedControlDigit] = useState<number | null>(null);
  const { toast } = useToast();

  const calculateControlDigitFromBase = (digits: string): number => {
    let a = 10;
    for (let i = 0; i < 10; i++) {
      const digit = parseInt(digits[i]);
      a = a + digit;
      a = a % 10;
      if (a === 0) a = 10;
      a = (a * 2) % 11;
    }
    
    let controlDigit = 11 - a;
    if (controlDigit === 10 || controlDigit === 11) {
      controlDigit = 0;
    }
    
    return controlDigit;
  };

  const handleOibChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
    setOib(value);
  };

  const handleBaseDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setBaseDigits(value);
    
    if (value.length === 10) {
      const controlDigit = calculateControlDigitFromBase(value);
      setGeneratedControlDigit(controlDigit);
    } else {
      setGeneratedControlDigit(null);
    }
  };

  const copyGeneratedOIB = () => {
    if (baseDigits.length === 10 && generatedControlDigit !== null) {
      const fullOib = baseDigits + generatedControlDigit;
      navigator.clipboard.writeText(fullOib);
      toast({
        title: "OIB kopiran",
        description: `Puni OIB ${fullOib} je kopiran u međuspremnik`,
      });
    }
  };

  const useGeneratedOIB = () => {
    if (baseDigits.length === 10 && generatedControlDigit !== null) {
      const fullOib = baseDigits + generatedControlDigit;
      setOib(fullOib);
      toast({
        title: "OIB prebačen u validator",
        description: "Možete vidjeti detaljnu validaciju u donjem dijelu",
      });
    }
  };

  const fillDummyData = () => {
    // Valid Croatian OIB for testing
    const testOib = "12345678903";
    const testBase = "1234567890";
    
    setOib(testOib);
    setBaseDigits(testBase);
    
    // Calculate control digit for the generator display
    const controlDigit = calculateControlDigitFromBase(testBase);
    setGeneratedControlDigit(controlDigit);
    
    toast({
      title: "Probni podaci učitani",
      description: "Možete vidjeti kako funkcioniraju i generator i validator",
    });
  };

  const resetForm = () => {
    setOib("");
    setBaseDigits("");
    setGeneratedControlDigit(null);
  };

  return (
    <div className="w-full">
      {/* Large screen layout: 3 columns */}
      <div className="hidden xl:grid xl:grid-cols-[320px,1fr,320px] xl:gap-6 xl:items-start">
        {/* Left sidebar - Structure Analysis */}
        <div className="sticky top-4 space-y-4">
          <OIBStructureDisplay oib={oib} />
          <OIBControlDigitCalculator oib={oib} />
        </div>

        {/* Center - Main Form */}
        <Card className="w-full max-w-2xl mx-auto bg-background">
          <CardHeader>
            <CardTitle className="text-center">OIB provjera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-4 mb-6">
              <Button onClick={fillDummyData} className="hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                <LuTestTube className="mr-2 h-4 w-4" /> Probni OIB
              </Button>
              <Button onClick={resetForm} className="hover:scale-105 hover:opacity-75 shadow-md shadow-red-500 hover:shadow-blue-500" variant="destructive">
                <LuRotateCcw className="mr-2 h-4 w-4" /> Resetiraj
              </Button>
            </div>

            <div className="space-y-6">
              {/* OIB Generator Section */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Generator kontrolne znamenke
                  </h3>
                  <p className="text-sm text-muted-foreground">Unesite 10 znamenki za izračun 11. kontrolne znamenke</p>
                </div>
                
                <div>
                  <label htmlFor="base-digits" className="block text-sm font-medium mb-2">
                    Osnovni broj (10 znamenki)
                  </label>
                  <Input
                    id="base-digits"
                    type="text"
                    placeholder="1234567890"
                    value={baseDigits}
                    onChange={handleBaseDigitsChange}
                    maxLength={10}
                    className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow font-mono text-lg tracking-wider"
                  />
                  {baseDigits && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{baseDigits.length}/10 znamenki</span>
                      {baseDigits.length === 10 && generatedControlDigit !== null && (
                        <span className="font-medium text-green-600 dark:text-green-400">
                          Kontrolna znamenka: {generatedControlDigit}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {baseDigits.length === 10 && generatedControlDigit !== null && (
                  <Card className="border-green-500/30 bg-green-500/5 dark:bg-green-500/10">
                    <CardContent className="pt-4">
                      <div className="text-center space-y-3">
                        <div className="text-green-800 dark:text-green-200">
                          <div className="text-lg font-bold">Generirani OIB</div>
                          <div className="text-2xl font-mono tracking-wider text-green-700 dark:text-green-300">
                            {baseDigits}<span className="bg-green-200 dark:bg-green-800 px-1 rounded">{generatedControlDigit}</span>
                          </div>
                        </div>
                        <div className="flex justify-center gap-2">
                          <Button size="sm" onClick={copyGeneratedOIB} variant="outline">
                            Kopiraj OIB
                          </Button>
                          <Button size="sm" onClick={useGeneratedOIB}>
                            Testiraj u Validatoru
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-sm text-muted-foreground">ili</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              {/* OIB Validator Section */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Validator postojećeg OIB-a
                  </h3>
                  <p className="text-sm text-muted-foreground">Unesite postojeći 11-znamenkasti OIB za provjeru ispravnosti</p>
                </div>
                
                <div>
                  <label htmlFor="oib" className="block text-sm font-medium mb-2">
                    OIB (11 znamenki)
                  </label>
                  <Input
                    id="oib"
                    type="text"
                    placeholder="12345678903"
                    value={oib}
                    onChange={handleOibChange}
                    maxLength={11}
                    className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow font-mono text-lg tracking-wider"
                  />
                  {oib && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{oib.length}/11 znamenki</span>
                      {oib.length === 11 && (
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          Spreman za validaciju
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <ValidationSummaryCard oib={oib} />
              
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  <strong>Napomena:</strong> Ova aplikacija služi samo za provjeru matematičke ispravnosti OIB-a.
                  Ne provjerava postoji li OIB u stvarnosti ili kome pripada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right sidebar - Validation Analysis */}
        <div className="sticky top-4 space-y-4">
          <OIBValidationDisplay oib={oib} />
        </div>
      </div>

      {/* Mobile/tablet layout: stacked */}
      <div className="xl:hidden">
        <Card className="w-full max-w-2xl mx-auto bg-background">
          <CardHeader>
            <CardTitle className="text-center">OIB provjera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-4 mb-6">
              <Button onClick={fillDummyData} className="hover:scale-105 hover:opacity-75 shadow-md shadow-green-500 hover:shadow-blue-500">
                <LuTestTube className="mr-2 h-4 w-4" /> Probni OIB
              </Button>
              <Button onClick={resetForm} className="hover:scale-105 hover:opacity-75 shadow-md shadow-red-500 hover:shadow-blue-500" variant="destructive">
                <LuRotateCcw className="mr-2 h-4 w-4" /> Resetiraj
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="oib-mobile" className="block text-sm font-medium mb-2">
                    OIB (Osobni identifikacijski broj)
                  </label>
                  <Input
                    id="oib-mobile"
                    type="text"
                    placeholder="Unesite 11 znamenki"
                    value={oib}
                    onChange={handleOibChange}
                    maxLength={11}
                    className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow font-mono text-lg tracking-wider"
                  />
                  {oib && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{oib.length}/11 znamenki</span>
                      {oib.length === 11 && (
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          Spreman za provjeru
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <ValidationSummaryCard oib={oib} />
              
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  <strong>Napomena:</strong> Ova aplikacija služi samo za provjeru matematičke ispravnosti OIB-a.
                  Ne provjerava postoji li OIB u stvarnosti ili kome pripada.
                </p>
              </div>
            </div>

            {/* Mobile validation components */}
            <div className="mt-8 space-y-4">
              <OIBStructureDisplay oib={oib} />
              <OIBControlDigitCalculator oib={oib} />
              <OIBValidationDisplay oib={oib} />
              
              {/* Educational Note */}
              <Card className="border-2 border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-blue-800 dark:text-blue-200">
                      <span className="text-lg font-bold">
                        Croatian OIB Algorithm
                      </span>
                      <p className="my-4 text-sm text-blue-600 dark:text-blue-300">
                        Svi izračuni se izvršavaju u realnom vremenu:
                      </p>
                      <ul className="list-disc mt-2 text-xs text-blue-600 dark:text-blue-300 space-y-1 text-left">
                        <li><strong>Struktura OIB-a</strong> - 10 osnovnih + 1 kontrolna znamenka</li>
                        <li><strong>Izračun kontrolne znamenke</strong> - korak po korak algoritam</li>
                        <li><strong>Matematička validacija</strong> - provjera ispravnosti postojećeg OIB-a</li>
                        <li><strong>Standardizirani postupak</strong> - koristi se u hrvatskim javnim institucijama</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}