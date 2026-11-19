import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation, QuotationItem } from '../types';

export function generateQuotationPdf(
  quotation: Quotation,
  items: QuotationItem[]
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Colors
  const primaryOrange: [number, number, number] = [245, 124, 0]; // #F57C00
  const darkNavy: [number, number, number] = [13, 43, 91]; // #0D2B5B
  const slateText: [number, number, number] = [51, 65, 85]; // #334155
  const lightGreyBg: [number, number, number] = [248, 250, 252]; // #F8FAFC
  const borderGrey: [number, number, number] = [226, 232, 240]; // #E2E8F0

  // 1. TOP HEADER ACCENT STRIP
  doc.setFillColor(...primaryOrange);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // 2. COMPANY HEADER
  let currentY = 12;

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...darkNavy);
  doc.text('KNR ENTERPRISES', margin, currentY);

  // Subtitle
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryOrange);
  doc.text('GOVERNMENT & PANCHAYAT WHOLESALE SUPPLIER', margin, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text(
    'H.No: 1-77/6, Near HP Petrol Pump, Chevella Mandal, Ranga Reddy District, Telangana - 501503',
    margin,
    currentY + 9
  );
  doc.text(
    'Tel: +91 8886175855 / 9640195798  |  Email: knrenterprises679@gmail.com',
    margin,
    currentY + 13
  );

  // Document Badge (Right Header)
  doc.setFillColor(...lightGreyBg);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(pageWidth - margin - 65, currentY - 2, 65, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryOrange);
  doc.text('OFFICIAL WHOLESALE QUOTATION', pageWidth - margin - 62, currentY + 2.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text(`Ref: ${quotation.quotationNumber}`, pageWidth - margin - 62, currentY + 7);
  doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString('en-IN')}`, pageWidth - margin - 62, currentY + 11);
  doc.text(`Valid Until: ${quotation.validityDate}`, pageWidth - margin - 62, currentY + 15);

  currentY += 24;

  // Horizontal divider
  doc.setDrawColor(...primaryOrange);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // 3. STATUTORY & BUYER INFORMATION (2 Column Cards)
  const boxWidth = (pageWidth - margin * 2 - 4) / 2;
  const boxHeight = 28;

  // Left Box: Supplier Statutory Details
  doc.setFillColor(...lightGreyBg);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkNavy);
  doc.text('SUPPLIER STATUTORY DETAILS:', margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slateText);
  doc.text('GSTIN: 36CUHPK5939D1ZG (State Code: 36 - Telangana)', margin + 3, currentY + 9);
  doc.text('Enterprise Reg: UDYAM-TS-18-0029341', margin + 3, currentY + 13);
  doc.text('Warehouse: Central Chevella Depot & Highway Logistics Yard', margin + 3, currentY + 17);
  doc.text(`Place of Supply: ${quotation.placeOfSupply}`, margin + 3, currentY + 21);

  // Right Box: Billed & Consigned To
  doc.roundedRect(margin + boxWidth + 4, currentY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkNavy);
  doc.text('BILLED & CONSIGNED TO:', margin + boxWidth + 7, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryOrange);
  doc.text(quotation.customerName || 'Procurement Officer', margin + boxWidth + 7, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slateText);
  doc.text(quotation.organisation || 'Gram Panchayat / Institutional Tender', margin + boxWidth + 7, currentY + 13);
  doc.text(`Delivery Location: ${quotation.deliveryAddress || 'Telangana'}`, margin + boxWidth + 7, currentY + 17);
  doc.text(`Phone: ${quotation.mobileNumber}  ${quotation.gstin ? `| GSTIN: ${quotation.gstin}` : ''}`, margin + boxWidth + 7, currentY + 21);

  currentY += boxHeight + 4;

  // 4. LINE ITEMS TABLE
  const tableData = items.map((it, idx) => [
    String(idx + 1),
    it.productName + (it.sku ? ` (${it.sku})` : ''),
    it.hsnCode || '-',
    `${it.quantity} ${it.unit}`,
    `₹${it.unitPrice.toLocaleString('en-IN')}`,
    it.discountPercent > 0 ? `${it.discountPercent}%` : '-',
    `₹${it.taxableValue.toLocaleString('en-IN')}`,
    `${it.gstRate}%`,
    `₹${it.totalPrice.toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      'S.No',
      'Description of Goods',
      'HSN/SAC',
      'Qty / Unit',
      'Rate (₹)',
      'Disc',
      'Taxable (₹)',
      'GST',
      'Total (₹)'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: darkNavy,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: slateText,
    },
    rowPageBreak: 'avoid',
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: darkNavy },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // 5. FINANCIAL SUMMARY & WORDS (Check if page break needed)
  let summaryY = finalY;
  if (summaryY > pageHeight - 65) {
    doc.addPage();
    summaryY = 15;
  }

  // Summary box (Right aligned)
  const summaryWidth = 85;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setFillColor(...lightGreyBg);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(summaryX, summaryY, summaryWidth, 42, 2, 2, 'FD');

  const printSummaryLine = (label: string, value: string, yPos: number, isBold: boolean = false, isAccent: boolean = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isAccent ? 9 : 7.5);
    doc.setTextColor(isAccent ? primaryOrange[0] : darkNavy[0], isAccent ? primaryOrange[1] : darkNavy[1], isAccent ? primaryOrange[2] : darkNavy[2]);
    doc.text(label, summaryX + 4, yPos);
    doc.text(value, pageWidth - margin - 4, yPos, { align: 'right' });
  };

  printSummaryLine('Total Taxable Value:', `₹${quotation.taxableValue.toLocaleString('en-IN')}`, summaryY + 5);

  if (quotation.taxType === 'INTRA_STATE') {
    printSummaryLine('Central GST (CGST @ 9%):', `₹${quotation.cgstAmount.toLocaleString('en-IN')}`, summaryY + 10);
    printSummaryLine('State GST (SGST @ 9%):', `₹${quotation.sgstAmount.toLocaleString('en-IN')}`, summaryY + 15);
  } else {
    printSummaryLine('Integrated GST (IGST @ 18%):', `₹${quotation.igstAmount.toLocaleString('en-IN')}`, summaryY + 12);
  }

  if (quotation.transportCharges > 0) {
    printSummaryLine('Freight & Transport Charges:', `₹${quotation.transportCharges.toLocaleString('en-IN')}`, summaryY + 20);
  } else {
    printSummaryLine('Highway Logistics / Freight:', 'Included', summaryY + 20);
  }

  if (quotation.packagingCharges > 0) {
    printSummaryLine('Packaging Charges:', `₹${quotation.packagingCharges.toLocaleString('en-IN')}`, summaryY + 25);
  }

  // Line before Grand Total
  doc.setDrawColor(...borderGrey);
  doc.line(summaryX + 3, summaryY + 30, pageWidth - margin - 3, summaryY + 30);

  printSummaryLine('GRAND TOTAL (INCL. GST):', `₹${quotation.grandTotal.toLocaleString('en-IN')}`, summaryY + 37, true, true);

  // Left Side: Amount in Words & Notes
  const wordsWidth = summaryX - margin - 4;
  doc.setFillColor(...lightGreyBg);
  doc.roundedRect(margin, summaryY, wordsWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkNavy);
  doc.text('TOTAL AMOUNT IN WORDS:', margin + 3, summaryY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryOrange);
  const splitWords = doc.splitTextToSize(quotation.amountInWords || 'Rupees Zero Only', wordsWidth - 6);
  doc.text(splitWords, margin + 3, summaryY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkNavy);
  doc.text('COMMERCIAL & LOGISTICS TERMS:', margin + 3, summaryY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...slateText);
  doc.text(`Payment: ${quotation.paymentTerms}`, margin + 3, summaryY + 26);
  doc.text(`Dispatch: ${quotation.deliveryTerms}`, margin + 3, summaryY + 30);
  doc.text(`Warranty: ${quotation.warrantyTerms}`, margin + 3, summaryY + 34);

  // 6. BOTTOM STATUTORY DECLARATION & SIGNATURE
  const bottomY = summaryY + 46;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...slateText);
  doc.text('STATUTORY DECLARATION:', margin, bottomY + 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(
    '1. All supplied materials strictly conform to Telangana State Lab Assay parameters (Chlorine > 33%, Virgin HDPE).',
    margin,
    bottomY + 7
  );
  doc.text(
    '2. Subject to Chevella Jurisdiction. Commercial rates quoted are firm during the stated validity period.',
    margin,
    bottomY + 11
  );

  // Authorized Signatory Seal (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkNavy);
  doc.text('For KNR ENTERPRISES', pageWidth - margin - 50, bottomY + 3);

  doc.setDrawColor(...borderGrey);
  doc.setLineDashPattern([1, 1], 0);
  doc.roundedRect(pageWidth - margin - 50, bottomY + 5, 50, 14, 1, 1, 'D');
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...slateText);
  doc.text('[ Authorized Signatory & Stamp ]', pageWidth - margin - 47, bottomY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkNavy);
  doc.text('Managing Partner / Depot Head', pageWidth - margin - 50, bottomY + 23);

  return doc;
}

export function downloadQuotationPdf(quotation: Quotation, items: QuotationItem[]): void {
  const doc = generateQuotationPdf(quotation, items);
  const filename = `KNR-Quotation-${quotation.quotationNumber}.pdf`;
  doc.save(filename);
}

export function getQuotationPdfBlobUrl(quotation: Quotation, items: QuotationItem[]): string {
  const doc = generateQuotationPdf(quotation, items);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

