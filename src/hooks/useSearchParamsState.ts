"use client"

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"
import type { ReadonlyURLSearchParams } from "next/navigation"

export interface SearchParamsState {
  searchParams: ReadonlyURLSearchParams
  setSearchParams: (params: URLSearchParams) => void
}

export function useSearchParamsState(): SearchParamsState {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setSearchParams = useCallback(
    (params: URLSearchParams) => {
      const newUrl = `${pathname}?${params.toString()}`
      router.push(newUrl)
    },
    [pathname, router],
  )

  return { searchParams, setSearchParams }
}