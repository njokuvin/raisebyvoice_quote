import { jsPDF } from 'jspdf';
import { Quotation, CompanyProfile } from '../types';
import { calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal, formatCurrency } from './quoteUtils';

export function generateQuotePDF(quote: Quotation, companyProfile?: CompanyProfile): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Default fallback company profile if none is supplied
  const profile = companyProfile || {
    name: 'RaisebyVoice_Quote',
    subtitle: 'Professional Services & Consulting',
    email: 'support@raisebyvoice.io',
    phone: '+1 (555) 987-6543',
    address: '123 Corporate Blvd, Suite 400\nNew York, NY 10001',
    logo: '',
    signatoryName: 'Jane Doe',
    signatoryTitle: 'Managing Director',
    whatsapp: '555-987-6543',
    country: 'United States'
  };

  // A4 dimensions: 210 x 297 mm
  // Margin: 20mm
  const margin = 20;
  const width = doc.internal.pageSize.getWidth();
  let y = margin;

  // Set colors (Optimized for maximum contrast & legibility)
  const primaryColor = [0, 0, 0]; // Black
  const darkTextColor = [0, 0, 0]; // Black
  const secondaryTextColor = [0, 0, 0]; // Black
  const lightBgColor = [241, 245, 249]; // Slate-100 for table header

  // 1. Draw Centered Semi-Transparent Background Watermark
  if (profile.logo) {
    try {
      const gState = (doc as any).GState;
      if (gState) {
        doc.saveGraphicsState();
        doc.setGState(new gState({ opacity: 0.05 }));
        const wmSize = 102; // Increased watermark size by 20% (85 * 1.2)
        const wmX = (width - wmSize) / 2;
        const wmY = (297 - wmSize) / 2;
        doc.addImage(profile.logo, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
        doc.restoreGraphicsState();
      }
    } catch (e) {
      console.warn('Could not draw GState watermark in PDF:', e);
    }
  }

  // 2. Draw Header Logo
  if (profile.logo) {
    try {
      // Draw logo in a 12mm x 12mm bounding box
      doc.addImage(profile.logo, 'PNG', margin, y, 12, 12, undefined, 'FAST');
    } catch (e) {
      console.warn('Failed to draw header logo in PDF:', e);
      // Fallback letter box logo
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.roundedRect(margin, y, 10, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(profile.name ? profile.name.charAt(0).toUpperCase() : 'C', margin + 3.5, y + 7);
    }
  } else {
    // Standard default block letter logo
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, y, 10, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(profile.name ? profile.name.charAt(0).toUpperCase() : 'C', margin + 3.5, y + 7);
  }

  // Business Name
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  const businessNameX = profile.logo ? margin + 15 : margin + 14;
  doc.text(profile.name, businessNameX, y + 7);

  // Document Title (Right-aligned)
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.text('QUOTATION', width - margin, y + 7, { align: 'right' });

  y += 15;

  // Subtitle / Contact Info
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text(profile.subtitle, margin, y);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Quote Number: ${quote.quoteNumber}`, width - margin, y, { align: 'right' });

  y += 5;
  doc.text(`${profile.email} | ${profile.phone}`, margin, y);
  
  doc.setFont('Helvetica', 'bold');
  doc.text(`Status: ${quote.status.toUpperCase()}`, width - margin, y, { align: 'right' });

  if (profile.address) {
    y += 4.5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    const splitCompanyAddr = doc.splitTextToSize(profile.address, 100);
    doc.text(splitCompanyAddr, margin, y);
    y += (splitCompanyAddr.length - 1) * 4;
  }

  // Horizontal Divider
  y += 7;
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.5);
  doc.line(margin, y, width - margin, y);

  y += 10;

  // Client Details vs Metadata (Grid style)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('PREPARED FOR:', margin, y);
  doc.text('QUOTE DETAILS:', width - margin - 65, y);

  y += 6.5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(quote.clientCompany || 'Client Company', margin, y);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Issue Date: ${quote.issueDate}`, width - margin - 65, y);

  y += 5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text(quote.clientName || 'Contact Name', margin, y);
  
  doc.setFont('Helvetica', 'normal');
  doc.text(`Valid Until: ${quote.validUntil}`, width - margin - 65, y);

  y += 5;
  doc.text(quote.clientEmail || 'client@example.com', margin, y);
  doc.text(`Currency: ${quote.currency}`, width - margin - 65, y);

  if (quote.clientAddress) {
    y += 5;
    const splitAddress = doc.splitTextToSize(quote.clientAddress, 75);
    doc.text(splitAddress, margin, y);
    y += (splitAddress.length - 1) * 4.5;
  }

  y += 12;

  // Table Header
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, y, width - 2 * margin, 8.5, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Description', margin + 3.5, y + 6);
  doc.text('Qty', width - margin - 55, y + 6, { align: 'center' });
  doc.text('Unit Price', width - margin - 30, y + 6, { align: 'right' });
  doc.text('Amount', width - margin - 3.5, y + 6, { align: 'right' });

  y += 8.5;

  // Table Rows (Higher contrast)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  quote.items.forEach((item) => {
    // Check page boundaries
    if (y > 245) {
      doc.addPage();
      y = margin + 10;
    }

    const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);

    // Split description if too long
    const descLines = doc.splitTextToSize(item.description || '', 95);
    
    doc.setFont('Helvetica', 'bold');
    doc.text(descLines, margin + 3.5, y + 5);
    doc.setFont('Helvetica', 'normal');

    doc.text(String(item.quantity || 0), width - margin - 55, y + 5, { align: 'center' });
    doc.text(formatCurrency(item.unitPrice || 0, quote.currency), width - margin - 30, y + 5, { align: 'right' });
    
    doc.setFont('Helvetica', 'bold');
    doc.text(formatCurrency(itemSubtotal, quote.currency), width - margin - 3.5, y + 5, { align: 'right' });
    doc.setFont('Helvetica', 'normal');

    const rowHeight = Math.max(5 + (descLines.length - 1) * 4.5, 9);
    
    y += rowHeight;
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.4);
    doc.line(margin, y, width - margin, y);
  });

  y += 6;

  // Calculations / Totals block on the right (Highly legible)
  const subtotal = calculateSubtotal(quote);
  const discountAmount = calculateDiscountAmount(quote);
  const taxAmount = calculateTaxAmount(quote);
  const grandTotal = calculateGrandTotal(quote);

  const totalLabelX = width - margin - 45;
  const totalValX = width - margin - 3.5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text('Subtotal:', totalLabelX, y, { align: 'right' });
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.text(formatCurrency(subtotal, quote.currency), totalValX, y, { align: 'right' });

  if (quote.discountPercentage > 0) {
    y += 5.5;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text(`Discount (${quote.discountPercentage}%):`, totalLabelX, y, { align: 'right' });
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('Helvetica', 'bold');
    doc.text(`-${formatCurrency(discountAmount, quote.currency)}`, totalValX, y, { align: 'right' });
  }

  if (quote.taxRate > 0) {
    y += 5.5;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text(`Tax (${quote.taxRate}%):`, totalLabelX, y, { align: 'right' });
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.setFont('Helvetica', 'bold');
    doc.text(`+${formatCurrency(taxAmount, quote.currency)}`, totalValX, y, { align: 'right' });
  }

  y += 7;
  doc.setDrawColor(15, 23, 42); // Black / Dark Slate-900
  doc.setLineWidth(0.6);
  doc.line(totalLabelX - 10, y - 4, totalValX, y - 4);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Grand Total:', totalLabelX, y, { align: 'right' });
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.text(formatCurrency(grandTotal, quote.currency), totalValX, y, { align: 'right' });

  // 3. Terms & Conditions Block (Full width) - Notes are fully removed as requested
  if (quote.terms) {
    y += 15;
    if (y > 235) {
      doc.addPage();
      y = margin + 10;
    }
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('Terms & Conditions:', margin, y);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    const splitTerms = doc.splitTextToSize(quote.terms, width - 2 * margin);
    doc.text(splitTerms, margin, y + 4.5);
    y += 6 + (splitTerms.length * 4);
  }

  // 4. Authorized Signatory Block (With customized signatory details)
  y += 15;
  if (y > 255) {
    doc.addPage();
    y = margin + 15;
  }

  // Draw Signatory Name in fancy handwriting style (Oblique) above line
  doc.setFont('Helvetica', 'oblique');
  doc.setFontSize(10.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(profile.signatoryName, margin + 5, y - 2);

  // Signatures lines (darker for printing)
  doc.setDrawColor(15, 23, 42); 
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + 65, y);
  doc.line(width - margin - 65, y, width - margin, y);

  y += 4.5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`Authorised Name & Signature (${profile.name})`, margin, y);
  doc.text('Client Acceptance Signature', width - margin, y, { align: 'right' });

  y += 4;
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`${profile.signatoryTitle}`, margin, y);
  doc.text('Authorized Signatory', width - margin, y, { align: 'right' });

  return doc;
}
