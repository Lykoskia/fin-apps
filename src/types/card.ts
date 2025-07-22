export interface CardInfo {
  isValid: boolean
  cardType: string | null
  bank: string | null
  country: string | null
  cardCategory: string | null
  cardLevel: string | null
  bin: string
  accountIdentifier: string
  checkDigit: string
  length: number
  luhnValid: boolean
  structure: CardStructure
  errors: string[]
}

export interface CardStructure {
  mii: string // Major Industry Identifier (1st digit)
  issuerIdentification: string // Rest of BIN after MII (digits 2-6/8)
  accountNumber: string // Individual account identifier (middle digits)
  checkDigit: string // Luhn check digit (last digit)
}

export interface BINRange {
  bin: string // 6 or 8 digit BIN
  binLength: number // 6 or 8 digits
  bank: string // Bank name
  bankCode?: string // Croatian bank code (for IBAN compatibility)
  cardType: string // Visa, Mastercard, American Express, etc.
  cardCategory: string // Credit, Debit, Prepaid
  cardLevel?: string // Standard, Gold, Platinum, etc.
  length: number[] // Valid card lengths [16] or [13,16,19]
  country: string // HR for Croatia
  currency: string // EUR for Croatia
  isActive: boolean // Whether this BIN is currently active
}

export interface BasicValidationResult {
  isBasicValid: boolean
  cardType: string | null
  luhnValid: boolean
  structure: CardStructure
  length: number
  errors: string[]
}
