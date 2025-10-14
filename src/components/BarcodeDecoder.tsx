/*
Still trying to wrap my head around the final version of this component and its Croatian character handling.
ZXing's PDF417 reader often misinterprets UTF-8 Croatian characters, leading to garbled text.
This implementation applies multiple strategies to fix common encoding issues while preserving newlines crucial for HUB3 format.
I will keep all the comments and logs for now to aid future debugging and understanding of the transformations.
Otherwise, in a few months, this code will look like hyerogliphics written by aliens and I will never touch it ever again and pray for Cthulhu's forgiveness just in case.
*/

import React, { useState, useRef, useCallback } from 'react';
import { BrowserPDF417Reader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Upload, FileImage, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { PaymentFormData } from '@/lib/schema';
import { purposeValues, type PurposeValue } from '@/lib/croatianPaymentData'; // Assuming purposeValues is imported from here

interface BarcodeDecoderProps {
  onDataDecoded: (data: Partial<PaymentFormData>) => void;
}

export default function BarcodeDecoder({ onDataDecoded }: BarcodeDecoderProps) {
  const [isDecoding, setIsDecoding] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validatePurposeCode = useCallback((code: string): PurposeValue => {
    const cleanCode = code.trim().toUpperCase();
    if (purposeValues.includes(cleanCode as PurposeValue)) {
      return cleanCode as PurposeValue;
    }
    console.warn(`Invalid purpose code "${code}", defaulting to "OTHR"`);
    return "OTHR";
  }, []);

  // === REFINED fixZXingCroatianEncoding FUNCTION ===
  // This function aims to correct Mojibake and clean problematic characters,
  // CRUCIALLY, it PRESERVES newlines for later splitting.
  const fixZXingCroatianEncoding = useCallback((text: string): string => {
    console.log('--- fixZXingCroatianEncoding Start ---');
    console.log('Input text (raw from ZXing):', JSON.stringify(text)); // Crucial for seeing what's really there

    let correctedText = text;

    // Strategy 1: Attempt to reverse UTF-8-as-Latin-1 Mojibake
    // This is the most common fix. The URIError often means the input isn't consistently encoded,
    // so we catch it and proceed to the explicit replacements.
    try {
        // Attempt to convert from Latin-1-encoded-UTF-8 bytes back to proper UTF-8 string
        const decoded = decodeURIComponent(escape(text));
        if (decoded !== text) { // If decoding actually changed something
            correctedText = decoded;
            console.log('Applied UTF-8-as-Latin-1 reversal:', JSON.stringify(correctedText));
        } else {
            console.log('UTF-8-as-Latin-1 reversal did not change the text or was not applicable.');
        }
    } catch (e) {
        console.warn('UTF-8-as-Latin-1 reversal attempt failed (likely URI malformed on problematic chars). Proceeding with explicit fixes:', e);
        // Do not `correctedText = text` here, keep `correctedText` as is, so explicit fixes can apply
    }

    // Strategy 2: Apply specific Croatian character explicit replacements
    // These patterns target the typical garbling that often slips through or causes the URIError.
    const replacements: Array<[RegExp, string]> = [
      // Common Mojibake for Croatian (UTF-8 bytes misinterpreted as Windows-1252/Latin-1)
      // These regex patterns explicitly check for the literal Unicode sequence that appears in the garbled string.
      // Example: `Ä\u2021` means the character 'Ä' (U+00C4) followed by character '‡' (U+2021).
      // These are not byte sequences, but JavaScript string representations of garbled UTF-8.
      [/Ä\u2021/g, 'ć'], // U+00C4 (Ä) + U+2021 (‡) -> ć
      [/Ä\u010d/g, 'č'], // U+00C4 (Ä) + U+010D (č) -> č
      [/Ä\u0091/g, 'đ'], // U+00C4 (Ä) + U+0091 (—) -> đ (This is often a common one)
      // FIX: Corrected pattern for lowercase 'š' from Å¡ (U+00C5, U+00A1)
      [/Å¡/g, 'š'], // U+00C5 (Å) followed by U+00A1 (¡) -> š
      [/Å\u017e/g, 'ž'], // U+00C5 (Å) + U+017E (ž) -> ž
      
      // UpperCase versions (based on common garbling)
      [/Ä\u008C/g, 'Č'], // ÄŒ -> Č
      [/Ä\u0086/g, 'Ć'], // Ä† -> Ć
      [/Ä\u0090/g, 'Đ'], // Ä? -> Đ (This could be U+00D0 eth, which is similar)
      // FIX: Corrected pattern for uppercase 'Š' from Å  (U+00C5, U+00A0)
      [/Å\u00a0/g, 'Š'], // U+00C5 (Å) followed by U+00A0 (non-breaking space) -> Š
      [/Å\u017d/g, 'Ž'], // Å½ -> Ž

      // Additional specific mojibake patterns that can occur
      // These typically involve the UTF-8 BOM or other common misinterpretations
      [/â\u20AC\u0161/g, 'š'], // 'â‚¬š' (Euro sign + š) -> 'š'
      [/â\u20AC\u017E/g, 'ž'], // 'â‚¬ž' -> 'ž'
      [/â\u20AC\u0107/g, 'ć'], // 'â‚¬ć' -> 'ć'
      [/â\u20AC\u010D/g, 'č'], // 'â‚¬č' -> 'č'
      [/â\u20AC\u0111/g, 'đ'], // 'â‚¬đ' -> 'đ'
      
      // Some very specific garbling observed
      [/ÄiÅ¡/g, 'čiš'], // Specific common sequence
      [/Ä\u008D/g, 'č'], // Another form of 'č'
      [/Ä\u0090/g, 'Đ'], // Another form of 'Đ'

      // Clean up common incorrect sequences like backticks, which can sometimes appear due to encoding issues
      [/`/g, ''],
    ];

    // Apply explicit fixes
    replacements.forEach(([pattern, replacement]) => {
      const before = correctedText;
      correctedText = correctedText.replace(pattern, replacement);
      if (correctedText !== before) {
        console.log(`Applied explicit Mojibake fix: '${pattern.source}' -> '${replacement}'`);
      }
    });

    // Strategy 3: SAFE Cleanup of other invalid/unwanted control characters, PRESERVING newlines (\n)
    // This regex targets control characters (0x00-0x09, 0x0B-0x0C, 0x0E-0x1F) and delete (0x7F),
    // but explicitly EXCLUDES \n (0x0A - Line Feed) and \r (0x0D - Carriage Return),
    // and \t (0x09 - Tab, though it's typically excluded by this regex already by being 0x09).
    // Keeping \n and \r is vital because HUB3 uses them as field separators,
    // and \r can sometimes appear before \n if data source used Windows line endings.
    // `.trim()` on individual lines later will handle any leftover \r or whitespace.
    correctedText = correctedText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    correctedText = correctedText.replace(/\uFFFD/g, ''); // Also remove Unicode replacement character explicitly

    // Note: No global `.trim()` here. We want to preserve newlines and carriage returns.
    // `normalize('NFC')` for consistent unicode representation.
    correctedText = correctedText.normalize('NFC');

    console.log('Final text after all Croatian fixes (pre-split):', JSON.stringify(correctedText));
    console.log('--- fixZXingCroatianEncoding End ---');
    return correctedText;
  }, []); // useCallback dependency array for fixZXingCroatianEncoding

  // Parse HUB3 barcode data with improved Croatian character handling
  const parseHUB3Data = useCallback((rawDecodedText: string): Partial<PaymentFormData> => {
    try {
      console.log('=== HUB3 Parsing Start ===');
      console.log('Raw ZXing output length (pre-fix):', rawDecodedText.length);
      console.log('Raw ZXing output (stringified for visibility):', JSON.stringify(rawDecodedText));

      const processedText = fixZXingCroatianEncoding(rawDecodedText);

      console.log('After fixZXingCroatianEncoding (processedText):', JSON.stringify(processedText)); // Use JSON.stringify for clarity

      // Crucial: Split by \n, then trim each line (which removes \r and spaces), but keep empty lines for fixed indexing
      const rawLines = processedText.split('\n').map(line => line.trim()); // Trim but keep empty lines
      console.log('Split into raw lines (trimmed, preserving empty):', rawLines.length, 'lines');
      console.log('Raw Lines (trimmed, preserving empty):', rawLines);

      // HUB3 specification has 14 fixed fields.
      // 0: HRVHUB30 (header)
      // 1: EUR (currency)
      // 2: Amount (15 digits)
      // 3: Sender Name
      // 4: Sender Street
      // 5: Sender Postcode City
      // 6: Receiver Name
      // 7: Receiver Street
      // 8: Receiver Postcode City
      // 9: IBAN
      // 10: Model (HRxx)
      // 11: Reference
      // 12: Purpose
      // 13: Description (optional)
      const EXPECTED_HUB3_FIELDS = 14;

      if (rawLines.length < EXPECTED_HUB3_FIELDS) { // Check if we have enough lines for all fields
        const firstLineForError = rawLines[0] || ''; // Safe access
        console.error(`Invalid format. Expected ${EXPECTED_HUB3_FIELDS} lines for HUB3, got: ${rawLines.length} lines. First line: "${firstLineForError}"`);
        throw new Error(`Invalid HUB3 barcode format. Expected ${EXPECTED_HUB3_FIELDS} lines, got: ${rawLines.length} lines. First line: "${firstLineForError}"`);
      }

      // Check for exact 'HRVHUB30' (after trimming, it should be exact)
      if (rawLines[0] !== 'HRVHUB30') {
          const firstLineContent = rawLines[0]; // Type is string now due to previous length check
          console.error(`Invalid format. Expected "HRVHUB30", got: "${firstLineContent}". (Length: ${firstLineContent.length})`);
          throw new Error(`Invalid format. Expected "HRVHUB30", got: "${firstLineContent}".`);
      }

      const amountStr = rawLines[2];
      // Amount is 15 digits (padded with leading zeros if necessary)
      if (!/^\d{15}$/.test(amountStr)) {
        console.error('Invalid amount format:', amountStr);
        throw new Error('Invalid amount format in barcode (expected 15 digits)');
      }

      const amountNumeric = parseInt(amountStr, 10) / 100; // radix 10 for safety
      const formattedAmount = amountNumeric === 0 ? "0,00" : amountNumeric.toLocaleString('hr-HR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      // Split postcode and city from lines[5] (Sender) and lines[8] (Receiver)
      const getPostcodeAndCity = (locationString: string): { postcode: string; city: string } => {
        const parts = locationString.trim().split(/\s+/); // Split by any whitespace
        if (parts.length === 0) return { postcode: '', city: '' };
        
        const postcodeCandidate = parts[0];
        if (/^\d{5}$/.test(postcodeCandidate)) {
          return {
            postcode: postcodeCandidate,
            city: parts.slice(1).join(' ')
          };
        }
        // If first part is not a 5-digit postcode, assume whole string is city
        // and postcode is empty. This is a common flexible handling.
        return {
          postcode: '',
          city: locationString
        };
      };

      const senderLocation = getPostcodeAndCity(rawLines[5] || '');
      const receiverLocation = getPostcodeAndCity(rawLines[8] || '');

      const modelWithPrefix = rawLines[10] || '';
      const model = modelWithPrefix.replace('HR', '').trim() || '00';

      const purposeCode = validatePurposeCode(rawLines[12] || 'OTHR');

      const result: Partial<PaymentFormData> = {
        senderName: rawLines[3] || '',
        senderStreet: rawLines[4] || '',
        senderPostcode: senderLocation.postcode,
        senderCity: senderLocation.city,
        receiverName: rawLines[6] || '',
        receiverStreet: rawLines[7] || '',
        receiverPostcode: receiverLocation.postcode,
        receiverCity: receiverLocation.city,
        iban: rawLines[9] || '',
        amount: formattedAmount,
        model: model,
        reference: rawLines[11] || '',
        purpose: purposeCode,
        description: rawLines[13] || '', // Description is at index 13
      };

      console.log('Final parsed result:', result);
      console.log('=== HUB3 Parsing End ===');
      return result;

    } catch (error) {
      console.error('Error parsing HUB3 data:', error);
      throw error; // Re-throw the specific error for better handling upstream
    }
  }, [fixZXingCroatianEncoding, validatePurposeCode]); // Add useCallback dependencies

  const decodeBarcode = async (imageFile: File) => {
    setIsDecoding(true);
    // Clear previous uploadedImage and revoke its URL if any
    clearUpload(); // This now correctly handles revoking
    setUploadedImage(URL.createObjectURL(imageFile)); // Set new image URL immediately

    try {
      console.log('=== Barcode Decoding Start ===');
      console.log('Image file:', imageFile.name, imageFile.type, imageFile.size, 'bytes');

      const image = new window.Image();
      const currentImageUrl = URL.createObjectURL(imageFile); // Create a fresh URL for the image processing
      image.src = currentImageUrl;

      await new Promise<void>((resolve, reject) => { // Explicitly set Promise generic type to void
        image.onload = () => {
          URL.revokeObjectURL(currentImageUrl); // Revoke after image is loaded into memory
          resolve();
        };
        image.onerror = (e) => {
          URL.revokeObjectURL(currentImageUrl);
          console.error('Image load error:', e);
          reject(new Error('Failed to load image'));
        };
      });

      console.log('Image loaded:', image.width, 'x', image.height);

      const codeReader = new BrowserPDF417Reader();

      console.log('Starting ZXing decode...');
      const result = await codeReader.decodeFromImageElement(image);

      console.log('ZXing decode successful!');
      console.log('Result format:', result.getBarcodeFormat());
      console.log('Raw text length:', result.getText().length);

      const rawText = result.getText();

      const parsedData = parseHUB3Data(rawText); // Use the refactored parsing

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
          errorMessage = `Nije valjan HUB3 format: ${error.message.split('First line: ')[1] || error.message.split(': ')[2] || "nepoznat razlog"}`; // More robust extraction
        } else if (error.message.includes("Invalid amount")) {
          errorMessage = "Barkod sadrži neispravan iznos. Provjerite je li barkod neoštećen.";
        } else if (error.message.includes("Failed to load image")) {
          errorMessage = "Nije moguće učitati sliku. Provjerite format datoteke.";
        } else if (error.message.includes("Failed to parse barcode data")) {
          errorMessage = `Greška pri parsiranju barkod podataka: ${error.message.split('. ')[1] || "nepoznat razlog"}`; // Use the specific error message from parseHUB3Data
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


  const handleFileSelect = useCallback((file: File) => {
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

    // Previous uploadedImage URL might still be active if not revoked.
    clearUpload(); // Ensure previous URL is revoked and state is reset.

    decodeBarcode(file);
  }, [decodeBarcode, toast]);


  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]); // Add handleFileSelect to dependencies

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]); // Add handleFileSelect to dependencies

  const clearUpload = useCallback(() => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage); // Revoke old object URL
    }
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
  }, [uploadedImage]); // Add uploadedImage to dependencies

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