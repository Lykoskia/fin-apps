import React from 'react';
import { NumericFormat } from 'react-number-format';
import { ControllerRenderProps } from 'react-hook-form';
import { PaymentFormData } from '@/lib/schema';

interface AmountInputProps {
  field: Partial<ControllerRenderProps<PaymentFormData, 'amount'>>;
  error?: boolean;
  disabled?: boolean;
}

export default function AmountInput({ 
  field, 
  error = false,
  disabled = false 
}: AmountInputProps) {
  // Convert Croatian format to numeric value for NumericFormat
  const getNumericValue = (croatianValue: string): number => {
    if (!croatianValue || croatianValue === "0,00") return 0;
    // Remove thousand separators and convert decimal separator
    const numericString = croatianValue.replace(/\./g, "").replace(",", ".");
    return parseFloat(numericString) || 0;
  };

  // Convert numeric value back to Croatian format
  const toCroatianFormat = (value: number): string => {
    if (!value || value === 0) return "0,00";
    return value.toLocaleString('hr-HR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <NumericFormat
      value={getNumericValue(field.value || "0,00")}
      onValueChange={(values) => {
        const croatianFormat = toCroatianFormat(values.floatValue || 0);
        field.onChange?.(croatianFormat);
      }}
      onBlur={field.onBlur}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      placeholder="0,00"
      disabled={disabled}
      className={`flex h-10 w-full rounded-md border ${
        error ? 'border-destructive' : 'border-input'
      } bg-muted/50 hover:bg-muted hover:shadow-green-200 hover:shadow px-3 py-2 text-sm shadow-sm transition-colors
      file:border-0 file:bg-transparent file:text-sm file:font-medium
      placeholder:text-muted-foreground focus-visible:outline-none
      focus-visible:ring-1 focus-visible:ring-ring
      disabled:cursor-not-allowed disabled:opacity-50`}
      valueIsNumericString={true}
      allowLeadingZeros={false}
      maxLength={12}
    />
  );
}