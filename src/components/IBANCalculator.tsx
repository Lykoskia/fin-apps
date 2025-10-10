"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronUp, ChevronDown, Calculator, List, X } from "lucide-react"
import { LuBan, LuPlay, LuLoader } from "react-icons/lu"
import { cn } from "@/lib/utils"
import {
  validateIBAN,
  generateIBAN,
  croatianBanks,
  serviceIBANMapping,
  validateCroatianAccountNumber,
} from "@/lib/croatianPaymentData"
import { useToast } from "@/hooks/use-toast"

interface IBANCalculatorProps {
  onIBANSelect: (iban: string) => void
}

export function IBANCalculator({ onIBANSelect }: IBANCalculatorProps) {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [selectedBank, setSelectedBank] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [isAccountNumberValid, setIsAccountNumberValid] = useState(true)
  const [openBankCombobox, setOpenBankCombobox] = useState(false)
  const [openServiceCombobox, setOpenServiceCombobox] = useState(false)
  const [selectedService, setSelectedService] = useState("")
  const [filteredBanks, setFilteredBanks] = useState(croatianBanks)
  const [filteredServices, setFilteredServices] = useState(serviceIBANMapping)
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  const handleBankFilter = (value: string) => {
    if (!value.trim()) {
      setFilteredBanks(croatianBanks)
      return
    }

    const searchTerms = value.toLowerCase().trim().split(/\s+/)
    setFilteredBanks(
      croatianBanks.filter((bank) => {
        const bankName = bank.name.toLowerCase()
        const bankCode = bank.code.toLowerCase()
        return searchTerms.every(
          (term) => bankName.includes(term) || bankCode.includes(term),
        )
      }),
    )
  }

  const handleServiceFilter = (value: string) => {
    const lowercaseValue = value.toLowerCase()
    setFilteredServices(
      serviceIBANMapping.filter(
        (service) =>
          service.service.toLowerCase().includes(lowercaseValue) ||
          service.IBAN.includes(value),
      ),
    )
  }

  useEffect(() => {
    if (accountNumber.length === 10) {
      if (!validateCroatianAccountNumber(accountNumber)) {
        toast({
          title: "Greška",
          description: "Neispravan broj računa (kontrolna znamenka).",
          variant: "destructive",
        })
        setIsAccountNumberValid(false)
      } else {
        setIsAccountNumberValid(true)
      }
    } else if (accountNumber.length > 0) {
      // Only set to false if it's not 10 digits and not empty
      setIsAccountNumberValid(false)
    } else {
      setIsAccountNumberValid(true) // If empty, consider it "valid" for input purposes
    }
  }, [accountNumber, toast])

  const handleGenerateIBAN = async () => {
    setIsLoading(true)
    const bank = croatianBanks.find((b) => b.name === selectedBank)
    if (!bank) {
      toast({
        title: "Greška",
        description: "Molimo odaberite valjanu banku.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }
    if (!isAccountNumberValid) {
      toast({
        title: "Greška",
        description: "Neispravan broj računa. Molimo provjerite unos.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }
    if (accountNumber.length !== 10) {
      toast({
        title: "Greška",
        description: "Broj računa mora imati točno 10 znamenki.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const generatedIBAN = generateIBAN(bank.code, accountNumber)
      if (validateIBAN(generatedIBAN)) {
        onIBANSelect(generatedIBAN)
        toast({
          title: "Uspjeh",
          description: `IBAN: ${generatedIBAN}`,
        })
        setIsGenerateOpen(false)
        setSelectedBank("")
        setAccountNumber("")
      } else {
        toast({
          title: "Greška",
          description:
            "Generirani IBAN je neispravan. Molimo provjerite unesene podatke.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom generiranja IBAN-a.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectIBAN = (service: string) => {
    const iban = serviceIBANMapping.find((s) => s.service === service)?.IBAN
    if (iban) {
      onIBANSelect(iban)
      toast({
        title: "Uspjeh",
        description: `IBAN: ${iban}`,
      })
      setIsSelectOpen(false)
      setSelectedService("")
    }
  }

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const accNum = e.target.value.replace(/\D/g, "").slice(0, 10)
    setAccountNumber(accNum)
  }

  const clearBankSelection = () => {
    setSelectedBank("")
    setOpenBankCombobox(false)
  }

  const clearServiceSelection = () => {
    setSelectedService("")
    setOpenServiceCombobox(false)
  }

  const isGenerateDisabled = !selectedBank || accountNumber.length !== 10 || !isAccountNumberValid

  return (
    <div className="space-y-4">
      <h3 className="text-center text-lg font-semibold">
        Generirajte ili odaberite IBAN:
      </h3>
      <div className="flex justify-center gap-4">
        <Button
          type="button"
          onClick={() => setIsGenerateOpen(true)}
          className="shadow-green-500 hover:shadow-blue-500 transition-all duration-200 hover:scale-105 hover:opacity-75 shadow-md"
        >
          <Calculator className="mr-2 h-4 w-4" /> Generiraj
        </Button>
        <Button
          type="button"
          onClick={() => setIsSelectOpen(true)}
          className="shadow-green-500 hover:shadow-blue-500 transition-all duration-200 hover:scale-105 hover:opacity-75 shadow-md"
        >
          <List className="mr-2 h-4 w-4" /> Odaberi
        </Button>
      </div>

      {/* Enhanced Generate IBAN Dialog - 80% screen height */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="top-[10vh] flex h-[80vh] flex-col translate-y-0 sm:max-w-[600px]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Generiraj IBAN</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-hidden py-4 flex-1">
            <div className="flex-shrink-0 space-y-2">
              <label htmlFor="bank-select" className="text-sm font-medium">
                Odaberi banku
              </label>
              <div className="relative">
                <Popover open={openBankCombobox} onOpenChange={setOpenBankCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBankCombobox}
                      className="w-full justify-between pr-8"
                    >
                      {selectedBank
                        ? croatianBanks.find((bank) => bank.name === selectedBank)
                          ?.name
                        : "Odaberi banku"}
                      {openBankCombobox ? (
                        <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[--radix-popover-trigger-width] p-0"
                    style={{ height: "70vh" }}
                  >
                    <Command className="h-full">
                      <CommandInput
                        placeholder="Pretraži banke..."
                        onValueChange={handleBankFilter}
                        className="focus:ring-0 border-none"
                      />
                      <CommandList className="max-h-none overflow-y-auto">
                        <CommandEmpty>Banka nije pronađena.</CommandEmpty>
                        <CommandGroup heading="Banke">
                          {selectedBank && (
                            <CommandItem
                              onSelect={clearBankSelection}
                              className="border-b border-border/50 text-muted-foreground"
                            >
                              <X className="mr-2 h-4 w-4" />
                              <span>Poništi odabir</span>
                            </CommandItem>
                          )}
                          {filteredBanks.map((bank) => (
                            <CommandItem
                              key={bank.code}
                              onSelect={() => {
                                setSelectedBank(
                                  bank.name === selectedBank ? "" : bank.name,
                                )
                                setOpenBankCombobox(false)
                              }}
                              className="transition-colors duration-150"
                            >
                              <div className="flex w-full items-center">
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedBank === bank.name
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {bank.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {bank.code}
                                  </span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedBank && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-8 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted transform"
                    onClick={clearBankSelection}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 space-y-2">
              <label htmlFor="account-number" className="text-sm font-medium">
                Broj računa
              </label>
              <Input
                id="account-number"
                type="text"
                placeholder="Unesi 10-znamenkasti broj računa"
                value={accountNumber}
                onChange={handleAccountNumberChange}
                maxLength={10}
                className={cn(
                  "transition-colors duration-200",
                  !isAccountNumberValid && accountNumber.length === 10
                    ? "border-red-500 focus:border-red-500"
                    : "",
                )}
              />
              {accountNumber.length > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{accountNumber.length}/10 znamenki</span>
                  {accountNumber.length === 10 && (
                    <span
                      className={cn(
                        "font-medium",
                        isAccountNumberValid ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {isAccountNumberValid ? "✓ Valjan" : "✗ Nevaljan"}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex justify-center pt-4">
              <Button
                type="button"
                onClick={handleGenerateIBAN}
                disabled={isGenerateDisabled || isLoading}
                className="transition-all duration-200 hover:scale-105 hover:opacity-75"
              >
                {isLoading ? (
                  <>
                    <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                    Generiram...
                  </>
                ) : isGenerateDisabled ? (
                  <>
                    <LuBan className="mr-2 h-4 w-4" />
                    Unesite podatke
                  </>
                ) : (
                  <>
                    <LuPlay className="mr-2 h-4 w-4" />
                    Generiraj
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Select IBAN Dialog - 80% screen height */}
      <Dialog open={isSelectOpen} onOpenChange={setIsSelectOpen}>
        <DialogContent className="top-[10vh] flex h-[80vh] flex-col translate-y-0 sm:max-w-[600px]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Odaberi IBAN</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-hidden py-4 flex-1">
            <div className="flex-shrink-0 space-y-2">
              <label htmlFor="service-select" className="text-sm font-medium">
                Odaberi instituciju
              </label>
              <div className="relative">
                <Popover open={openServiceCombobox} onOpenChange={setOpenServiceCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openServiceCombobox}
                      className="w-full justify-between pr-8"
                    >
                      {selectedService
                        ? serviceIBANMapping.find(
                          (service) => service.service === selectedService,
                        )?.service
                        : "Odaberi instituciju"}
                      {openServiceCombobox ? (
                        <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[--radix-popover-trigger-width] p-0"
                    style={{ height: "70vh" }}
                  >
                    <Command className="h-full">
                      <CommandInput
                        placeholder="Pretraži institucije..."
                        onValueChange={handleServiceFilter}
                        className="focus:ring-0 border-none"
                      />
                      <CommandList className="max-h-none overflow-y-auto">
                        <CommandEmpty>Institucija nije pronađena.</CommandEmpty>
                        <CommandGroup heading="Institucije">
                          {selectedService && (
                            <CommandItem
                              onSelect={clearServiceSelection}
                              className="border-b border-border/50 text-muted-foreground"
                            >
                              <X className="mr-2 h-4 w-4" />
                              <span>Poništi odabir</span>
                            </CommandItem>
                          )}
                          {filteredServices.map((service) => (
                            <CommandItem
                              key={service.service}
                              onSelect={() => {
                                setSelectedService(service.service)
                                setOpenServiceCombobox(false)
                              }}
                              className="transition-colors duration-150"
                            >
                              <div className="flex w-full items-center">
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedService === service.service
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {service.service}
                                  </span>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {service.IBAN}
                                  </span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedService && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-8 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted transform"
                    onClick={clearServiceSelection}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 flex justify-center gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedService("")
                }}
                className="transition-all duration-200 hover:scale-105 hover:opacity-75"
              >
                <LuBan className="mr-2 h-4 w-4" /> Poništi
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (selectedService) {
                    handleSelectIBAN(selectedService)
                  }
                }}
                disabled={!selectedService}
                className="transition-all duration-200 hover:scale-105 hover:opacity-75"
              >
                {!selectedService ? (
                  <LuBan className="mr-2 h-4 w-4" />
                ) : (
                  <LuPlay className="mr-2 h-4 w-4" />
                )}
                Odaberi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}