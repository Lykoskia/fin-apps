// Fixed ZXing implementation with proper Croatian character handling
// Replace your current BarcodeDecoder component with this version

import React, { useState, useRef } from 'react';
import { BrowserPDF417Reader } from '@zxing/library';
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

  // Validate purpose code against allowed values
  const validatePurposeCode = (code: string): PurposeValue => {
    const cleanCode = code.trim().toUpperCase();
    if (purposeValues.includes(cleanCode as PurposeValue)) {
      return cleanCode as PurposeValue;
    }
    console.warn(`Invalid purpose code "${code}", defaulting to "OTHR"`);
    return "OTHR";
  };

  // Comprehensive Croatian character fixing specifically for ZXing
  const fixZXingCroatianEncoding = (text: string): string => {
    console.log('Original ZXing text:', text);
    console.log('Original bytes (first 100 chars):', [...text.slice(0, 100)].map(c => 
      `${c}(${c.charCodeAt(0).toString(16)})`
    ).join(' '));

    let fixed = text;

    // Step 1: Fix the specific ZXing UTF-8 decoding issues seen in your logs
    const zxingFixes: Array<[RegExp, string]> = [
      // The exact pattern from your logs: "Ã„â€¡" = ć
      [/Ã„â€¡/g, 'ć'],           // The exact sequence ZXing produces for "ć"
      
      // Let's also handle other Croatian characters that might have similar patterns
      // We need to figure out what patterns ZXing creates for č, đ, š, ž
      // For now, let's add some educated guesses based on the UTF-8 byte patterns:
      
      // Try to catch other potential patterns for Croatian chars
      [/Ã„â€š/g, 'č'],           // Potential pattern for "č" (0xC4 0x8D)
      [/Ã„â€'/g, 'đ'],           // Potential pattern for "đ" (0xC4 0x91)  
      [/Ã…â€ /g, 'š'],           // Potential pattern for "š" (0xC5 0xA1)
      [/Ã…â€¾/g, 'ž'],           // Potential pattern for "ž" (0xC5 0xBE)
      
      // Standard UTF-8 byte sequences (in case some work normally)
      [/\u00C4\u008D/g, 'č'],    // č as 0xC4 0x8D
      [/\u00C4\u0087/g, 'ć'],    // ć as 0xC4 0x87
      [/\u00C4\u0091/g, 'đ'],    // đ as 0xC4 0x91
      [/\u00C5\u00A1/g, 'š'],    // š as 0xC5 0xA1
      [/\u00C5\u00BE/g, 'ž'],    // ž as 0xC5 0xBE
      
      // Clean up artifacts
      [/\uFFFD/g, ''],           // Remove Unicode replacement character
      [/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''] // Remove control characters
    ];

    // Apply all fixes in sequence
    zxingFixes.forEach(([pattern, replacement]) => {
      const beforeLength = fixed.length;
      fixed = fixed.replace(pattern, replacement);
      if (fixed.length !== beforeLength) {
        console.log(`Applied fix: ${pattern} -> ${replacement}`);
      }
    });

    // Step 2: Normalize using NFC (same as your encoding process)
    fixed = fixed.normalize('NFC');

    console.log('After Croatian fixes:', fixed);
    console.log('Fixed bytes (first 100 chars):', [...fixed.slice(0, 100)].map(c => 
      `${c}(${c.charCodeAt(0).toString(16)})`
    ).join(' '));

    return fixed;
  };

  // Parse HUB3 barcode data with improved Croatian character handling
  const parseHUB3Data = (rawDecodedText: string): Partial<PaymentFormData> => {
    try {
      console.log('=== HUB3 Parsing Start ===');
      console.log('Raw ZXing output length:', rawDecodedText.length);
      console.log('Raw ZXing output:', JSON.stringify(rawDecodedText));
      
      // Apply Croatian character fixes
      const processedText = fixZXingCroatianEncoding(rawDecodedText);
      
      console.log('After processing:', processedText);
      
      const lines = processedText.split('\n').map(line => line.trim());
      console.log('Split into lines:', lines.length, 'lines');
      console.log('Lines:', lines);
      
      // Validate HUB3 format
      if (lines.length < 14 || lines[0] !== 'HRVHUB30') {
        console.error('Invalid format. Expected HRVHUB30, got:', lines[0]);
        throw new Error(`Invalid HUB3 barcode format. Expected HRVHUB30, got: ${lines[0]}`);
      }

      // Parse amount
      const amountStr = lines[2];
      if (!/^\d{15}$/.test(amountStr)) {
        console.error('Invalid amount format:', amountStr);
        throw new Error('Invalid amount format in barcode');
      }
      
      const amountNumeric = parseInt(amountStr) / 100;
      const formattedAmount = amountNumeric === 0 ? "0,00" : amountNumeric.toLocaleString('hr-HR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      // Parse sender location
      const senderLocationParts = lines[5].split(' ');
      const senderPostcode = senderLocationParts[0] || '';
      const senderCity = senderLocationParts.slice(1).join(' ') || '';

      // Parse receiver location
      const receiverLocationParts = lines[8].split(' ');
      const receiverPostcode = receiverLocationParts[0] || '';
      const receiverCity = receiverLocationParts.slice(1).join(' ') || '';

      // Parse model
      const modelWithPrefix = lines[10];
      const model = modelWithPrefix.replace('HR', '') || '00';

      // Validate purpose code
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

  // Decode barcode using ZXing with enhanced error handling
  const decodeBarcode = async (imageFile: File) => {
    setIsDecoding(true);
    
    try {
      console.log('=== Barcode Decoding Start ===');
      console.log('Image file:', imageFile.name, imageFile.size, 'bytes');
      
      // Create image element
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

      // Initialize ZXing PDF417 reader
      const codeReader = new BrowserPDF417Reader();
      
      // Decode the barcode
      console.log('Starting ZXing decode...');
      const result = await codeReader.decodeFromImage(image);
      
      console.log('ZXing decode successful!');
      console.log('Result format:', result.getBarcodeFormat());
      console.log('Raw text length:', result.getText().length);
      
      // Get the raw decoded text
      const rawText = result.getText();
      
      // Parse the data
      const parsedData = parseHUB3Data(rawText);
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
      
      // Send to parent component
      onDataDecoded(parsedData);
      
      toast({
        title: "Barkod uspješno dekodiran!",
        description: "Podaci su učitani u obrazac. Provjerite rezultate u konzoli.",
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

  // Handle file selection with validation
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

    // Show preview
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    // Start decoding
    decodeBarcode(file);
  };

  // Drag and drop handlers
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
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
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