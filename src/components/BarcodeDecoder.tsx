/*

Still trying to wrap my head around the final version of this component and its Croatian character handling.
ZXing's PDF417 reader often misinterprets UTF-8 Croatian characters, leading to garbled text.
This implementation applies multiple strategies to fix common encoding issues while preserving newlines crucial for HUB3 format.
I will keep all the comments and logs for now to aid future debugging and understanding of the transformations.
Otherwise, in a few months, this code will look like hyerogliphics written by aliens and I will never touch it ever again and pray for Cthulhu's forgiveness just in case.

*/

import React, { useState, useRef } from 'react';
import { BrowserPDF417Reader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Upload, FileImage, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { PaymentFormData } from '@/lib/schema';
import { purposeValues, type PurposeValue } from '@/lib/croatianPaymentData';

interface BarcodeDecoderProps {
  onDataDecoded: (data: Partial<PaymentFormData>) => void;
}

export default function BarcodeDecoder({ onDataDecoded }: BarcodeDecoderProps) {
  const [isDecoding, setIsDecoding] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validatePurposeCode = (code: string): PurposeValue => {
    const cleanCode = code.trim().toUpperCase();
    if (purposeValues.includes(cleanCode as PurposeValue)) {
      return cleanCode as PurposeValue;
    }
    console.warn(`Invalid purpose code "${code}", defaulting to "OTHR"`);
    return "OTHR";
  };

  // === REFINED fixZXingCroatianEncoding FUNCTION (SAFELY PRESERVING NEWLINES) ===
  const fixZXingCroatianEncoding = (text: string): string => {
    console.log('--- fixZXingCroatianEncoding Start ---');
    console.log('Input text (raw from ZXing):', JSON.stringify(text)); // Crucial for seeing what's really there
    
    let correctedText = text;

    // Strategy 1: Attempt to reverse UTF-8-as-Latin-1 Mojibake (This often fixes newlines too)
    try {
        const decoded = decodeURIComponent(escape(text));
        // Check if it seems like a valid reversal. It should produce `\n` (0x0A) for newlines.
        // We're less concerned about `\uFFFD` if `decodeURIComponent` works as expected.
        if (decoded !== text) { // If decoding actually changed something
            correctedText = decoded;
            console.log('Applied UTF-8-as-Latin-1 reversal:', JSON.stringify(correctedText));
        } else {
             console.log('UTF-8-as-Latin-1 reversal did not change the text.');
        }
    } catch (e) {
        console.warn('UTF-8-as-Latin-1 reversal attempt failed:', e);
    }

    // Strategy 2: Apply specific Croatian character explicit replacements
    // These patterns target the typical garbling.
    const replacements: Array<[RegExp, string]> = [
      // Common Mojibake for Croatian (UTF-8 bytes misinterpreted as Windows-1252)
      // These assume the `\u2021` (‡) etc. are correctly formed unicode chars in the JS string
      [/Ä\u2021/g, 'ć'], // U+00C4 (Ä) + U+2021 (‡) -> ć
      [/Ä\u2030/g, 'đ'], // U+00C4 (Ä) + U+2030 (‰) -> đ
      [/Ä\u2039/g, 'č'], // U+00C4 (Ä) + U+2039 (‹) -> č
      [/Å\u00a1/g, 'š'], // U+00C5 (Å) + U+00a1 (¡) -> š
      [/Å\u017e/g, 'ž'], // U+00C5 (Å) + U+017e (ž) -> ž
      // Uppercase (verify these against actual ZXing output if issues persist)
      [/Ä\u008C/g, 'Č'], // U+00C4 (Ä) + U+008C (Œ) -> Č
      [/Ä\u0086/g, 'Ć'], // U+00C4 (Ä) + U+0086 (Æ) -> Ć
      [/Ä\u0090/g, 'Đ'], // U+00C4 (Ä) + U+0090 ( ) -> Đ
      [/Å\u00a0/g, 'Š'], // U+00C5 (Å) + U+00a0 ( ) -> Š
      [/Å\u017d/g, 'Ž'], // U+00C5 (Å) + U+017D (Ž) -> Ž

      // Other common potential single character issues that might slip through
      [/Ä\u0087/g, 'ć'], // Just in case a slightly different unicode sequence for ć shows up
      [/Ä\u008D/g, 'č'], // Just in case
      [/Ä\u0091/g, 'đ'], // Just in case
      [/Å\u00a1/g, 'š'], // Just in case
      [/Å\u017e/g, 'ž'], // Just in case
    ];

    // Apply specific fixes
    replacements.forEach(([pattern, replacement]) => {
      const before = correctedText;
      correctedText = correctedText.replace(pattern, replacement);
      if (correctedText !== before) {
        console.log(`Applied explicit Mojibake fix: '${pattern.source}' -> '${replacement}'`);
      }
    });

    // Strategy 3: SAFE Cleanup of invalid/unwanted characters, PRESERVING newlines
    // We only remove null characters and the Unicode Replacement Character.
    // Control characters from 0x01-0x1F are problematic for parsing unless they are newlines (0x0A) or tabs (0x09).
    // Given the HUB3 format uses newlines, we must explicitly keep 0x0A.
    // The `\x00` (NULL) and `\uFFFD` (replacement char) are definite bad.
    correctedText = correctedText.replace(/\x00/g, ''); // Remove NULL bytes
    correctedText = correctedText.replace(/\uFFFD/g, ''); // Remove Unicode replacement character

    // We no longer use /[\x00-\x1F\x7F]/g, as it removed the `\n`.
    // If other non-printable chars (besides newline) are still an issue,
    // they need to be targeted very specifically (e.g., /\t/g for tabs if not wanted).

    // Final normalization to ensure consistent form and trim whitespace
    correctedText = correctedText.normalize('NFC').trim();

    console.log('Final text after all Croatian fixes:', JSON.stringify(correctedText));
    console.log('--- fixZXingCroatianEncoding End ---');
    return correctedText;
  };
  // === END UPDATED fixZXingCroatianEncoding FUNCTION ===

  // Parse HUB3 barcode data with improved Croatian character handling
  const parseHUB3Data = (rawDecodedText: string): Partial<PaymentFormData> => {
    try {
      console.log('=== HUB3 Parsing Start ===');
      console.log('Raw ZXing output length:', rawDecodedText.length);
      console.log('Raw ZXing output (stringified for visibility):', JSON.stringify(rawDecodedText));

      const processedText = fixZXingCroatianEncoding(rawDecodedText);

      console.log('After processing (fixZXingCroatianEncoding):', processedText);

      const lines = processedText.split('\n').map(line => line.trim());
      console.log('Split into lines:', lines.length, 'lines');
      console.log('Lines:', lines);

      if (lines.length < 14 || lines[0] !== 'HRVHUB30') {
        console.error('Invalid format. Expected HRVHUB30, got:', lines[0]);
        throw new Error(`Invalid HUB3 barcode format. Expected HRVHUB30, got: ${lines[0]}`);
      }

      const amountStr = lines[2];
      if (!/^\d{15}$/.test(amountStr)) {
        console.error('Invalid amount format:', amountStr);
        throw new Error('Invalid amount format in barcode');
      }

      const amountNumeric = parseInt(amountStr, 10) / 100; // radix 10 for safety
      const formattedAmount = amountNumeric === 0 ? "0,00" : amountNumeric.toLocaleString('hr-HR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const senderLocationParts = lines[5].split(' ');
      const senderPostcode = senderLocationParts[0] || '';
      const senderCity = senderLocationParts.slice(1).join(' ') || '';

      const receiverLocationParts = lines[8].split(' ');
      const receiverPostcode = receiverLocationParts[0] || '';
      const receiverCity = receiverLocationParts.slice(1).join(' ') || '';

      const modelWithPrefix = lines[10];
      const model = modelWithPrefix.replace('HR', '') || '00';

      const purposeCode = validatePurposeCode(lines[12] || 'OTHR');

      const result = {
        senderName: lines[3] || '',
        senderStreet: lines[4] || '',
        senderPostcode: senderPostcode,
        senderCity: senderCity,
        receiverName: lines[6] || '',
        receiverStreet: lines[7] || '',
        receiverPostcode: receiverPostcode,
        receiverCity: receiverCity,
        iban: lines[9] || '',
        amount: formattedAmount,
        model: model,
        reference: lines[11] || '',
        purpose: purposeCode,
        description: lines[13] || '',
      };

      console.log('Final parsed result:', result);
      console.log('=== HUB3 Parsing End ===');
      return result;
    } catch (error) {
      console.error('Error parsing HUB3 data:', error);
      throw new Error('Failed to parse barcode data. Please ensure this is a valid HUB3 payment barcode.');
    }
  };

  const decodeBarcode = async (imageFile: File) => {
    setIsDecoding(true);

    try {
      console.log('=== Barcode Decoding Start ===');
      console.log('Image file:', imageFile.name, imageFile.type, imageFile.size, 'bytes');

      const imageUrl = URL.createObjectURL(imageFile);
      const image = new window.Image();

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = (e) => {
          console.error('Image load error:', e);
          reject(new Error('Failed to load image'));
        };
        image.src = imageUrl;
      });

      console.log('Image loaded:', image.width, 'x', image.height);

      const codeReader = new BrowserPDF417Reader();

      console.log('Starting ZXing decode...');
      const result = await codeReader.decodeFromImageElement(image);

      console.log('ZXing decode successful!');
      console.log('Result format:', result.getBarcodeFormat());
      console.log('Raw text length:', result.getText().length);

      const rawText = result.getText();

      const parsedData = parseHUB3Data(rawText);

      URL.revokeObjectURL(imageUrl);

      onDataDecoded(parsedData);

      toast({
        title: "Barkod uspješno dekodiran!",
        description: "Podaci su učitani u obrazac. Provjerite konzolu za detalje dekodiranja.",
      });

    } catch (error) {
      console.error('=== Barcode Decoding Error ===');
      console.error('Error details:', error);

      let errorMessage = "Nije moguće dekodirati barkod. Provjerite je li slika jasna i sadrži valjan HUB3 barkod.";

      if (error instanceof Error) {
        console.log('Error type:', error.constructor.name);
        console.log('Error message:', error.message);

        if (error.message.includes("No MultiFormat Readers")) {
          errorMessage = "Barkod nije pronađen na slici. Provjerite je li barkod jasno vidljiv.";
        } else if (error.message.includes("Invalid HUB3")) {
          errorMessage = "Barkod nije u HUB3 formatu. Molimo koristite hrvatski plaćalni barkod.";
        } else if (error.message.includes("Invalid amount")) {
          errorMessage = "Barkod sadrži neispravan iznos. Provjerite je li barkod neoštećen.";
        } else if (error.message.includes("Failed to load image")) {
          errorMessage = "Nije moguće učitati sliku. Provjerite format datoteke.";
        } else if (error.message.includes("Failed to parse barcode data")) {
          errorMessage = error.message; // Use the specific error message from parseHUB3Data
        }
      }

      toast({
        title: "Greška pri dekodiranju",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDecoding(false);
      console.log('=== Barcode Decoding End ===');
    }
  };

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name, file.type, file.size);

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Neispravna datoteka",
        description: "Molimo odaberite sliku (PNG, JPG, JPEG).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Datoteka prevelika",
        description: "Slika mora biti manja od 10MB.",
        variant: "destructive",
      });
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    decodeBarcode(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const clearUpload = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
    }
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <FileImage className="h-5 w-5" />
          Učitaj i dekodiraj barkod
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!uploadedImage ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Povucite sliku barkoda ovdje ili
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isDecoding}
                >
                  Odaberite datoteku
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Podržani formati: PNG, JPG, JPEG (max 10MB) • ZXing PDF417
              </p>
            </div>

            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isDecoding}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <div className="relative w-full max-w-md mx-auto">
                <Image
                  src={uploadedImage}
                  alt="Uploaded barcode"
                  width={400}
                  height={200}
                  className="w-full h-auto rounded-lg border"
                  style={{ objectFit: 'contain' }}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={clearUpload}
                  disabled={isDecoding}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isDecoding && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Dekodiram barkod s poboljšanom UTF-8 podrškom...</span>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isDecoding}
              >
                Učitaj drugu sliku
              </Button>
            </div>

            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
              disabled={isDecoding}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}