"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { placeValues } from "@/lib/croatianPaymentData"
import type { UseFormReturn } from "react-hook-form"
import type { PaymentFormData } from "@/lib/schema"

interface PlaceLookupProps {
  section: "sender" | "receiver"
  form: UseFormReturn<PaymentFormData>
}

type PostcodeFieldName = `${PlaceLookupProps["section"]}Postcode`
type CityFieldName = `${PlaceLookupProps["section"]}City`

export function PlaceLookup({ section, form }: PlaceLookupProps) {
  const postcodeRef = React.useRef<HTMLInputElement>(null)

  const handlePostcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const postcode = event.target.value
    if (postcode.length === 5) {
      const foundPlace = placeValues.get(Number(postcode))
      if (foundPlace) {
        form.setValue(`${section}City` as CityFieldName, foundPlace)
      }
    }
  }

  const handleKeyDownPostCode = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      ["Tab", "Backspace", "Delete", "ArrowLeft", "ArrowRight", "F5"].includes(event.key) ||
      (event.ctrlKey && ["c", "v", "a", "C", "V", "A"].includes(event.key))
    ) {
      return
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault()
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name={`${section}Postcode` as PostcodeFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Broj pošte <span className="text-sm text-muted-foreground/50">5 br.</span>
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                ref={postcodeRef}
                placeholder="npr. 10000"
                className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow"
                maxLength={5}
                onChange={(e) => {
                  field.onChange(e)
                  handlePostcodeChange(e)
                }}
                onKeyDown={handleKeyDownPostCode}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${section}City` as CityFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Mjesto <span className="text-sm text-muted-foreground/50">max. 21</span>
            </FormLabel>
            <FormControl>
              <Input {...field} placeholder="npr. Zagreb" className="bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow" maxLength={21} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

