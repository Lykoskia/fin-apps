import { CROATIAN_BIN_RANGES } from "./bin-database"
import { luhnCheck } from "./client-validation"
import type { BINRange } from "@/types/card"

/**
 * Find Croatian BIN information for a card number
 */
export function findCroatianBIN(cardNumber: string): BINRange | null {
  const number = cardNumber.replace(/\D/g, "")

  if (number.length < 6) {
    return null
  }

  const sortedBins = CROATIAN_BIN_RANGES.filter((range) => range.isActive).sort((a, b) => b.binLength - a.binLength)

  for (const binRange of sortedBins) {
    if (number.startsWith(binRange.bin)) {
      return binRange
    }
  }

  return null
}

/**
 * Generate Luhn check digit for a card number prefix
 */
export function generateCheckDigit(cardNumberPrefix: string): string {
  const number = cardNumberPrefix.replace(/\D/g, "")

  for (let checkDigit = 0; checkDigit <= 9; checkDigit++) {
    const testNumber = number + checkDigit.toString()
    if (luhnCheck(testNumber)) {
      return checkDigit.toString()
    }
  }

  return "0"
}

/**
 * Generate a valid test card number for a given BIN
 */
export function generateCardNumber(bin: string, targetLength = 16): string {
  const cleanBin = bin.replace(/\D/g, "")

  if (cleanBin.length > targetLength - 1) {
    throw new Error(`BIN length (${cleanBin.length}) is too long for target card length (${targetLength})`)
  }

  if (targetLength < 13 || targetLength > 19) {
    throw new Error("Target length must be between 13-19 digits")
  }

  const accountLength = targetLength - cleanBin.length - 1

  let accountNumber = ""
  for (let i = 0; i < accountLength; i++) {
    accountNumber += Math.floor(Math.random() * 10).toString()
  }

  const cardPrefix = cleanBin + accountNumber
  const checkDigit = generateCheckDigit(cardPrefix)

  return cardPrefix + checkDigit
}

/**
 * Get list of all Croatian banks from the database
 */
export function getCroatianBanks(): string[] {
  const banks = new Set<string>()

  CROATIAN_BIN_RANGES.filter((range) => range.isActive).forEach((range) => banks.add(range.bank))

  return Array.from(banks).sort()
}

/**
 * Get all BIN ranges for a specific Croatian bank
 */
export function getBankBINs(bankName: string): BINRange[] {
  return CROATIAN_BIN_RANGES.filter((range) => range.bank === bankName && range.isActive)
}

/**
 * Get bank statistics for analytics
 */
export function getBankStatistics() {
  const stats = {
    totalBanks: 0,
    totalBINs: 0,
    cardTypes: {} as Record<string, number>,
    cardCategories: {} as Record<string, number>,
  }

  const activeBins = CROATIAN_BIN_RANGES.filter((range) => range.isActive)
  const uniqueBanks = new Set(activeBins.map((range) => range.bank))

  stats.totalBanks = uniqueBanks.size
  stats.totalBINs = activeBins.length

  activeBins.forEach((range) => {
    stats.cardTypes[range.cardType] = (stats.cardTypes[range.cardType] || 0) + 1
    stats.cardCategories[range.cardCategory] = (stats.cardCategories[range.cardCategory] || 0) + 1
  })

  return stats
}
