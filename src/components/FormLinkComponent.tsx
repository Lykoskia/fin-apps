import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as LucideLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import Image from 'next/image';
import { UseFormWatch } from 'react-hook-form';
import type { PaymentFormData } from '@/lib/schema';
import { debounce } from 'lodash';

interface FormLinkComponentProps {
  watch: UseFormWatch<PaymentFormData>;
}

export default function FormLinkComponent({ watch }: FormLinkComponentProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [formUrl, setFormUrl] = useState<string>('');

  // Watch all form fields
  const formData = watch();

  // Debounced QR code generation
  const generateQRCode = useCallback(
    debounce((url: string) => {
      QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating QR code:', err));
    }, 500),
    []
  );

  useEffect(() => {
    // Create URL parameters from form data
    const params = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        params.append(key, value.toString());
      }
    });

    // Get the base URL from the current window location
    const baseUrl = typeof window !== 'undefined' ?
      `${window.location.protocol}//${window.location.host}${window.location.pathname}` : '';
    const fullUrl = `${baseUrl}?${params.toString()}`;

    // Update the URL immediately
    setFormUrl(fullUrl);

    // Generate QR code with debounce
    generateQRCode(fullUrl);

    // Cleanup function to cancel pending debounced calls
    return () => {
      generateQRCode.cancel();
    };
  }, [formData, generateQRCode]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-center">Podijeli obrazac</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        {qrCodeUrl && (
          <div className="inline-block bg-white ring-1 ring-black/5">
            <Image
              src={qrCodeUrl}
              alt="QR kod za dijeljenje obrasca"
              width={200}
              height={200}
              className="mx-auto"
              priority
            />
          </div>
        )}
        <div className="text-center max-w-full px-4">
          <>
            <p className="pb-2">Skeniraj QR kod ili klikni:</p>
            <Button
              asChild
              variant="link"
              className="text-sky-600 hover:text-sky-800"
            >
              <Link
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LucideLink className="mr-2 h-4 w-4" />
                Link na trenutno stanje
              </Link>
            </Button>
          </>
        </div>
      </CardContent>
    </Card>
  );
};