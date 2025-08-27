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
    // Clean up the code (remove whitespace, convert to uppercase)
    const cleanCode = code.trim().toUpperCase();
    
    // Check if it's a valid purpose value
    if (purposeValues.includes(cleanCode as PurposeValue)) {
      return cleanCode as PurposeValue;
    }
    
    // If invalid, return default "OTHR" (Other)
    console.warn(`Invalid purpose code "${code}", defaulting to "OTHR"`);
    return "OTHR";
  };

  // Parse HUB3 barcode data back into form fields
  const parseHUB3Data = (decodedText: string): Partial<PaymentFormData> => {
    try {
      const lines = decodedText.split('\n').map(line => line.trim());
      
      // HUB3 format structure:
      // 0: HRVHUB30 (header)
      // 1: EUR (currency)
      // 2: Amount (15 digits, padded with zeros)
      // 3: Sender name
      // 4: Sender street
      // 5: Sender postcode and city
      // 6: Receiver name
      // 7: Receiver street
      // 8: Receiver postcode and city
      // 9: IBAN
      // 10: Model (HR + model number)
      // 11: Reference
      // 12: Purpose code
      // 13: Description

      if (lines.length < 14 || lines[0] !== 'HRVHUB30') {
        throw new Error('Invalid HUB3 barcode format');
      }

      // Parse amount - convert from 15-digit padded format back to Croatian format
      const amountStr = lines[2];
      if (!/^\d{15}$/.test(amountStr)) {
        throw new Error('Invalid amount format in barcode');
      }
      
      const amountNumeric = parseInt(amountStr) / 100; // Convert from cents to euros
      const formattedAmount = amountNumeric === 0 ? "0,00" : amountNumeric.toLocaleString('hr-HR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      // Parse sender location (postcode and city)
      const senderLocationParts = lines[5].split(' ');
      const senderPostcode = senderLocationParts[0] || '';
      const senderCity = senderLocationParts.slice(1).join(' ') || '';

      // Parse receiver location (postcode and city)
      const receiverLocationParts = lines[8].split(' ');
      const receiverPostcode = receiverLocationParts[0] || '';
      const receiverCity = receiverLocationParts.slice(1).join(' ') || '';

      // Parse model - remove HR prefix
      const modelWithPrefix = lines[10];
      const model = modelWithPrefix.replace('HR', '') || '00';

      // Validate and clean the purpose code
      const purposeCode = validatePurposeCode(lines[12] || 'OTHR');

      return {
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
    } catch (error) {
      console.error('Error parsing HUB3 data:', error);
      throw new Error('Failed to parse barcode data. Please ensure this is a valid HUB3 payment barcode.');
    }
  };

  // Decode barcode from image
  const decodeBarcode = async (imageFile: File) => {
    setIsDecoding(true);
    
    try {
      // Create image element for processing
      const imageUrl = URL.createObjectURL(imageFile);
      const image = new window.Image();
      
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageUrl;
      });

      // Initialize PDF417 reader (the format used for HUB3 barcodes)
      const codeReader = new BrowserPDF417Reader();
      
      // Decode the barcode using the correct method name
      const result = await codeReader.decodeFromImage(image);
      
      // Parse the decoded text (which should be in HUB3 format)
      const parsedData = parseHUB3Data(result.getText());
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
      
      // Call the callback with parsed data
      onDataDecoded(parsedData);
      
      toast({
        title: "Barkod uspješno dekodiran!",
        description: "Podaci su učitani u obrazac. Možete ih sada uređivati po potrebi.",
      });

    } catch (error) {
      console.error('Barcode decoding error:', error);
      
      let errorMessage = "Nije moguće dekodirati barkod. Provjerite je li slika jasna i sadrži valjan HUB3 barkod.";
      
      if (error instanceof Error) {
        // Provide more specific error messages
        if (error.message.includes("No MultiFormat Readers")) {
          errorMessage = "Barkod nije pronađen na slici. Provjerite je li barkod jasno vidljiv.";
        } else if (error.message.includes("Invalid HUB3")) {
          errorMessage = "Barkod nije u HUB3 formatu. Molimo koristite hrvatski plaćalni barkod.";
        } else if (error.message.includes("Invalid amount")) {
          errorMessage = "Barkod sadrži neispravan iznos. Provjerite je li barkod neoštećen.";
        }
      }
      
      toast({
        title: "Greška pri dekodiranju",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDecoding(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Neispravna datoteka",
        description: "Molimo odaberite sliku (PNG, JPG, JPEG).",
        variant: "destructive",
      });
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Datoteka prevelika",
        description: "Slika mora biti manja od 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Show image preview
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    // Start decoding
    decodeBarcode(file);
  };

  // Handle drag and drop
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
                Podržani formati: PNG, JPG, JPEG (max 10MB)
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
                <span className="text-sm">Dekodiram barkod...</span>
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