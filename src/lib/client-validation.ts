import type { CardStructure, BasicValidationResult } from "@/types/card"

/**
 * Major Industry Identifiers (MII) - First digit of card number
 * Both Visa (4) and Mastercard (5) are banking/financial industry
 */
export const MII_CODES = {
  "0": "ISO/TC 68 and other industry assignments",
  "1": "Airlines",
  "2": "Airlines, financial and other future industry assignments",
  "3": "Travel and entertainment",
  "4": "Banking and financial (Visa)",
  "5": "Banking and financial (Mastercard)",
  "6": "Merchandising and banking/financial",
  "7": "Petroleum and other future industry assignments",
  "8": "Healthcare, telecommunications and other future industry assignments",
  "9": "For assignment by national standards bodies",
} as const

/**
 * Luhn Algorithm Implementation
 */
export function luhnCheck(cardNumber: string): boolean {
  const number = cardNumber.replace(/\D/g, "")

  if (number.length === 0) return false

  let sum = 0
  let isEven = false

  for (let i = number.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(number[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Determine card type based on BIN patterns
 */
export function getCardType(cardNumber: string): string | null {
  const number = cardNumber.replace(/\D/g, "")

  if (/^4/.test(number)) return "Visa"
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return "Mastercard"
  if (/^3[47]/.test(number)) return "American Express"
  if (/^30[0-5]/.test(number) || /^3[68]/.test(number)) return "Diners Club"
  if (/^6011/.test(number) || /^65/.test(number) || /^64[4-9]/.test(number)) return "Discover"
  if (/^35/.test(number)) return "JCB"
  if (
    /^5[6-9]/.test(number) ||
    (/^6/.test(number) && !/^6011/.test(number) && !/^65/.test(number) && !/^64[4-9]/.test(number))
  )
    return "Maestro"

  return null
}

/**
 * Parse card number structure into components
 */
export function parseCardStructure(cardNumber: string): CardStructure {
  const number = cardNumber.replace(/\D/g, "")

  if (number.length === 0) {
    return {
      mii: "",
      issuerIdentification: "",
      accountNumber: "",
      checkDigit: "",
    }
  }

  const mii = number.charAt(0)
  const binLength = 6
  const bin = number.substring(0, binLength)
  const issuerIdentification = bin.substring(1)
  const checkDigit = number.length > 0 ? number.charAt(number.length - 1) : ""
  const accountNumber = number.length > binLength ? number.substring(binLength, number.length - 1) : ""

  return {
    mii,
    issuerIdentification,
    accountNumber,
    checkDigit,
  }
}

/**
 * Validate card length for specific card types
 */
export function isValidLength(cardNumber: string, cardType: string): boolean {
  const number = cardNumber.replace(/\D/g, "")
  const length = number.length

  switch (cardType) {
    case "Visa":
      return length === 13 || length === 16 || length === 19
    case "Mastercard":
    case "Discover":
    case "JCB":
      return length === 16
    case "American Express":
      return length === 15
    case "Diners Club":
      return length === 14 || length === 16
    case "Maestro":
      return length >= 12 && length <= 19
    default:
      return length >= 13 && length <= 19
  }
}

/**
 * Basic client-side validation for immediate UX feedback
 */
export function validateCardBasic(cardNumber: string): BasicValidationResult {
  const number = cardNumber.replace(/\D/g, "")
  const errors: string[] = []

  if (!number) {
    errors.push("Card number is required")
  } else if (number.length < 13 || number.length > 19) {
    errors.push("Card number must be between 13-19 digits")
  }

  const luhnValid = luhnCheck(number)
  if (!luhnValid && number.length >= 13) {
    errors.push("Invalid card number (Luhn check failed)")
  }

  const cardType = getCardType(number)
  if (!cardType && number.length >= 6) {
    errors.push("Unknown card type")
  }

  if (cardType && !isValidLength(number, cardType)) {
    errors.push(`Invalid length for ${cardType} card`)
  }

  const structure = parseCardStructure(number)

  return {
    isBasicValid: errors.length === 0,
    cardType,
    luhnValid,
    structure,
    length: number.length,
    errors,
  }
}

/**
 * Format card number for display (add spaces every 4 digits)
 */
export function formatCardNumber(cardNumber: string): string {
  const number = cardNumber.replace(/\D/g, "")
  return number.replace(/(.{4})/g, "$1 ").trim()
}

/**
 * Clean and validate card number input
 */
export function cleanCardNumber(input: string): string {
  return input.replace(/\D/g, "").substring(0, 19)
}
