"use server"

import {
  findCroatianBIN,
  generateCardNumber,
  getCroatianBanks,
  getBankBINs,
  getBankStatistics,
} from "@/lib/server-validation"
import { luhnCheck, getCardType, parseCardStructure, isValidLength } from "@/lib/client-validation"
import type { CardInfo, BINRange } from "@/types/card"

/**
 * SERVER ACTION: Complete card validation with BIN database lookup
 */
export async function validateCardComplete(cardNumber: string): Promise<CardInfo> {
  const errors: string[] = []
  const number = cardNumber.replace(/\D/g, "")

  if (!number) {
    errors.push("Card number is required")
    return {
      isValid: false,
      cardType: null,
      bank: null,
      country: null,
      cardCategory: null,
      cardLevel: null,
      bin: "",
      accountIdentifier: "",
      checkDigit: "",
      length: 0,
      luhnValid: false,
      structure: { mii: "", issuerIdentification: "", accountNumber: "", checkDigit: "" },
      errors,
    }
  }

  if (number.length < 13 || number.length > 19) {
    errors.push("Card number must be between 13-19 digits")
  }

  const structure = parseCardStructure(number)
  const luhnValid = luhnCheck(number)
  if (!luhnValid) {
    errors.push("Invalid card number (Luhn check failed)")
  }

  const cardType = getCardType(number)
  if (!cardType && number.length >= 6) {
    errors.push("Unknown card type")
  }

  if (cardType && !isValidLength(number, cardType)) {
    errors.push(`Invalid length for ${cardType} card`)
  }

  const binInfo = findCroatianBIN(number)
  const binLength = binInfo ? binInfo.binLength : 6
  const bin = number.substring(0, binLength)
  const accountIdentifier = number.length > binLength ? number.substring(binLength, number.length - 1) : ""
  const checkDigit = number.length > 0 ? number.charAt(number.length - 1) : ""

  const updatedStructure = {
    ...structure,
    issuerIdentification: bin.substring(1),
    accountNumber: accountIdentifier,
    checkDigit: checkDigit,
  }

  const result: CardInfo = {
    isValid: errors.length === 0,
    cardType: binInfo?.cardType || cardType,
    bank: binInfo?.bank || null,
    country: binInfo?.country || null,
    cardCategory: binInfo?.cardCategory || null,
    cardLevel: binInfo?.cardLevel || null,
    bin,
    accountIdentifier,
    checkDigit,
    length: number.length,
    luhnValid,
    structure: updatedStructure,
    errors,
  }

  return result
}

/**
 * SERVER ACTION: Get list of all Croatian banks
 */
export async function getCroatianBanksList(): Promise<string[]> {
  try {
    return getCroatianBanks()
  } catch (error) {
    console.error("Error fetching Croatian banks:", error)
    return []
  }
}

/**
 * SERVER ACTION: Get BIN ranges for a specific bank
 */
export async function getBankBINsList(bankName: string): Promise<BINRange[]> {
  try {
    if (!bankName.trim()) {
      return []
    }
    return getBankBINs(bankName)
  } catch (error) {
    console.error("Error fetching bank BINs:", error)
    return []
  }
}

/**
 * SERVER ACTION: Generate a test card number
 */
export async function generateTestCard(
  bin: string,
  targetLength = 16,
): Promise<{
  success: boolean
  cardNumber?: string
  error?: string
}> {
  try {
    if (!bin.trim()) {
      return {
        success: false,
        error: "BIN is required",
      }
    }

    if (!/^\d{6,8}$/.test(bin)) {
      return {
        success: false,
        error: "BIN must be 6-8 digits",
      }
    }

    if (targetLength < 13 || targetLength > 19) {
      return {
        success: false,
        error: "Card length must be between 13-19 digits",
      }
    }

    const cardNumber = generateCardNumber(bin, targetLength)

    return {
      success: true,
      cardNumber,
    }
  } catch (error) {
    console.error("Error generating test card:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate card",
    }
  }
}

/**
 * SERVER ACTION: Get banking statistics
 */
export async function getBankingStatistics(): Promise<{
  totalBanks: number
  totalBINs: number
  cardTypes: Record<string, number>
  cardCategories: Record<string, number>
}> {
  try {
    return getBankStatistics()
  } catch (error) {
    console.error("Error fetching banking statistics:", error)
    return {
      totalBanks: 0,
      totalBINs: 0,
      cardTypes: {},
      cardCategories: {},
    }
  }
}
