// lib/generate-payment-pdf.ts

import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Import for side-effects ONLY. This runs the plugin.
import QRCode from 'qrcode';

import type { PaymentFormData } from '@/lib/schema';
import type { UserOptions } from 'jspdf-autotable';


interface GeneratePdfOptions {
  formData: PaymentFormData;
  barcodeImageUrl: string;
  formLink: string;
}

let notoSansFontData: string | undefined;

async function loadNotoSansFont(): Promise<string> {
  if (notoSansFontData) {
    return notoSansFontData;
  }

  const fontPath = '/fonts/NotoSans-Regular.ttf';
  try {
    const response = await fetch(fontPath);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to load font from ${fontPath}: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`Failed to load font from ${fontPath}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    notoSansFontData = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        '',
      ),
    );
    console.log(`Noto Sans font (${fontPath}) loaded successfully.`);
    return notoSansFontData;
  } catch (error) {
    console.error('Error fetching Noto Sans font:', error);
    throw error;
  }
}

export async function generatePaymentPdf({
  formData,
  barcodeImageUrl,
  formLink,
}: GeneratePdfOptions): Promise<void> {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const fontName = 'NotoSans';
  try {
    const fontData = await loadNotoSansFont();
    doc.addFileToVFS(`${fontName}.ttf`, fontData);
    doc.addFont(`${fontName}.ttf`, fontName, 'normal');
    doc.setFont(fontName, 'normal');
    console.log('Font set in jsPDF:', fontName);
  } catch (error) {
    console.warn('Could not embed Noto Sans font. Falling back to Helvetica.', error);
    doc.setFont('helvetica', 'normal');
  }
  doc.setFontSize(10);

  const margin = 15;
  let yPos = margin;
  const pageCenterX = doc.internal.pageSize.getWidth() / 2;
  const contentWidth = doc.internal.pageSize.getWidth() - (margin * 2);

  // const lineHeight = 5; // <-- REMOVED: No longer directly used
  const tableSectionPadding = 3; // Minimal padding above table headers
  const sectionSpacingAfterTable = 15; // Increased space AFTER a table block
  const spacingWithinUnit = 5; // Spacing between text and image, or image and link
  const spacingBetweenUnits = 20; // Increased spacing BETWEEN barcode unit and QR unit

  const tableRowHeight = 5;

  const col1Width = contentWidth * 0.5;
  const col2Width = contentWidth * 0.5;

  let actualBarcodeRenderedWidth: number = 0;

  const renderSection = (
    title: string,
    bodyData: (string | number)[][],
    startY: number,
  ) => {
    // Add small padding above the table title
    yPos += tableSectionPadding; // Apply padding here

    const autotableOptions: UserOptions = {
      startY: startY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [[{ content: title, colSpan: 2 }]],
      body: bodyData,
      headStyles: {
        fillColor: '#e0e0e0',
        textColor: '#333',
        fontSize: 10,
        halign: 'center',
        lineWidth: 0.1,
        lineColor: '#dddddd',
        fontStyle: 'bold',
      },
      styles: {
        font: doc.getFontList().hasOwnProperty(fontName) ? fontName : 'helvetica',
        fontStyle: 'normal',
        fontSize: 8,
        cellPadding: 1,
        minCellHeight: tableRowHeight,
        lineWidth: 0.1,
        lineColor: '#dddddd',
      },
      columnStyles: {
        0: { cellWidth: col1Width, fontStyle: 'bold' },
        1: { cellWidth: col2Width },
      },
    };

    doc.autoTable(autotableOptions);
    return doc.lastAutoTable.finalY + sectionSpacingAfterTable; // Use new spacing
  };


  yPos = renderSection(
    'Podaci o pošiljatelju',
    [
      ['Ime i prezime / Naziv', formData.senderName || ''],
      ['Adresa', formData.senderStreet || ''],
      ['Poštanski broj', formData.senderPostcode || ''],
      ['Mjesto', formData.senderCity || ''],
    ],
    yPos,
  );

  yPos = renderSection(
    'Podaci o primatelju',
    [
      ['Ime i prezime / Naziv', formData.receiverName || ''],
      ['Adresa', formData.receiverStreet || ''],
      ['Poštanski broj', formData.receiverPostcode || ''],
      ['Mjesto', formData.receiverCity || ''],
    ],
    yPos,
  );

  yPos = renderSection(
    'Podaci o plaćanju',
    [
      ['IBAN primatelja', formData.iban || 'HR'],
      ['Iznos (EUR)', formData.amount || '0,00'],
      ['Model', `HR${formData.model || '00'}`],
      ['Poziv na broj', formData.reference || ''],
      ['Namjena', formData.purpose || 'OTHR'],
      ['Opis plaćanja', formData.description || ''],
    ],
    yPos,
  );

  // --- Barcode Unit ---
  if (barcodeImageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = barcodeImageUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const barcodeHeight = 20;
          const aspectRatio = img.width / img.height;
          let calculatedBarcodeWidth = barcodeHeight * aspectRatio;
          
          const maxBarcodeWidth = contentWidth * 0.8;
          calculatedBarcodeWidth = Math.min(calculatedBarcodeWidth, maxBarcodeWidth);

          actualBarcodeRenderedWidth = calculatedBarcodeWidth;

          doc.setFontSize(11);
          doc.text('Generirani barkod:', pageCenterX, yPos, { align: 'center' });
          yPos += spacingWithinUnit; // Spacing between text and barcode image

          const barcodeX = pageCenterX - (calculatedBarcodeWidth / 2);

          doc.addImage(
            img,
            'PNG',
            barcodeX,
            yPos,
            calculatedBarcodeWidth,
            barcodeHeight,
            undefined,
            'FAST',
          );
          yPos += barcodeHeight + spacingBetweenUnits; // Spacing AFTER barcode unit
          resolve();
        };
        img.onerror = (error) => {
          console.error('Error loading barcode image for PDF:', error);
          reject(new Error('Failed to load barcode image for PDF'));
        };
      });
    } catch (error) {
      console.error('Failed to add barcode to PDF:', error);
      doc.setFontSize(9);
      doc.setTextColor(255, 0, 0);
      doc.text('Greška pri učitavanju barkoda.', pageCenterX, yPos, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    }
  }

  // --- QR Code Unit ---
  if (formLink && actualBarcodeRenderedWidth > 0) {
    const finalQrCodeSize = actualBarcodeRenderedWidth; // Match barcode width

    doc.setFontSize(11);
    doc.text('Link za obrazac (skenirajte QR kod):', pageCenterX, yPos, { align: 'center' });
    yPos += spacingWithinUnit; // Spacing between text and QR code image

    try {
      const qrDataUrl: string = await QRCode.toDataURL(formLink, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 1,
      });

      const qrCodeX = pageCenterX - (finalQrCodeSize / 2);
      doc.addImage(qrDataUrl, 'PNG', qrCodeX, yPos, finalQrCodeSize, finalQrCodeSize, undefined, 'FAST',);
      yPos += finalQrCodeSize + spacingWithinUnit; // Spacing between QR code image and link

      const linkText = "Otvori obrazac s ovim podacima";
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 255);
      doc.textWithLink(linkText, pageCenterX, yPos, { url: formLink, align: 'center' });
      doc.setTextColor(0, 0, 0);
      // No extra yPos increment here, date footer will follow
      // yPos += 5; 

    } catch (error) {
      console.error('Error generating QR code for PDF:', error);
      doc.setFontSize(9);
      doc.setTextColor(255, 0, 0);
      doc.text('Greška pri generiranju QR koda.', pageCenterX, yPos, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.textWithLink("Otvori obrazac", pageCenterX, yPos + 5, { url: formLink, align: 'center' });
      yPos += 15;
    }
  }

  // --- Footer: Current Date and Time ---
  const currentDate = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  const formattedDateTime = currentDate.toLocaleString('hr-HR', options);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  // Position closer to bottom, ensure it's below all content units
  doc.text(
    `Generirano: ${formattedDateTime}`,
    pageCenterX,
    doc.internal.pageSize.getHeight() - (margin / 2),
    { align: 'center' }
  );

  doc.save(`uplatnica_${new Date().toISOString().split('T')[0]}.pdf`);
}