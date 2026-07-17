import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Printer, Download, Copy, Check, Sparkles, Building, Calendar, 
  FileText, MessageSquare, Smartphone, ArrowRight,
  ShieldAlert, CheckCheck, HelpCircle, Send
} from 'lucide-react';
import { Quotation, CompanyProfile } from '../types';
import { 
  calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, 
  calculateGrandTotal, formatCurrency 
} from '../utils/quoteUtils';
import { generateQuotePDF } from '../utils/pdfGenerator';

interface QuotePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quotation;
  companyProfile: CompanyProfile;
  onUpdateQuote?: (updated: Quotation) => void;
}

export const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({ isOpen, onClose, quote, companyProfile, onUpdateQuote }) => {
  const [copied, setCopied] = useState(false);
  const [showSendOverlay, setShowSendOverlay] = useState(false);

  // WhatsApp States
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [whatsAppSuccess, setWhatsAppSuccess] = useState(false);

  const subtotal = calculateSubtotal(quote);
  const discountAmount = calculateDiscountAmount(quote);
  const taxAmount = calculateTaxAmount(quote);
  const grandTotal = calculateGrandTotal(quote);

  // Sync initial state when quote opens
  useEffect(() => {
    if (isOpen && quote) {
      const clientNameText = quote.clientName || 'Valued Customer';
      setWhatsAppMessage(
        `Hello ${clientNameText}, here is your quotation ${quote.quoteNumber} from ${companyProfile.name}. Grand Total: ${formatCurrency(grandTotal, quote.currency)}. Valid until ${quote.validUntil}.`
      );

      // Determine default country phone code from company country details
      const normCountry = (companyProfile.country || '').trim().toLowerCase();
      let defaultCode = '+1';
      const countryCodeMap: Record<string, string> = {
        'united states': '+1',
        'us': '+1',
        'usa': '+1',
        'canada': '+1',
        'ca': '+1',
        'united kingdom': '+44',
        'uk': '+44',
        'great britain': '+44',
        'gb': '+44',
        'england': '+44',
        'germany': '+49',
        'de': '+49',
        'deutschland': '+49',
        'india': '+91',
        'in': '+91',
        'nigeria': '+234',
        'ng': '+234',
        'australia': '+61',
        'au': '+61',
        'france': '+33',
        'fr': '+33',
        'brazil': '+55',
        'br': '+55',
        'south africa': '+27',
        'za': '+27',
        'singapore': '+65',
        'sg': '+65',
      };
      if (normCountry) {
        if (countryCodeMap[normCountry]) {
          defaultCode = countryCodeMap[normCountry];
        } else {
          const foundKey = Object.keys(countryCodeMap).find(key => 
            normCountry.includes(key) || key.includes(normCountry)
          );
          if (foundKey) {
            defaultCode = countryCodeMap[foundKey];
          }
        }
      }
      setPhoneCountryCode(defaultCode);
      setWhatsAppPhone(companyProfile.whatsapp || '');
      setWhatsAppSuccess(false);
    }
  }, [isOpen, quote, grandTotal, companyProfile]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const pdf = generateQuotePDF(quote, companyProfile);
    pdf.save(`${quote.quoteNumber}.pdf`);
  };

  const handleCopyText = () => {
    const text = `QUOTATION: ${quote.quoteNumber}
Client: ${quote.clientCompany || quote.clientName}
Date: ${quote.issueDate} (Valid until ${quote.validUntil})
--------------------------------------------------
ITEMS:
${quote.items.map(i => `- ${i.description} (Qty: ${i.quantity}) @ ${formatCurrency(i.unitPrice, quote.currency)} = ${formatCurrency(i.quantity * i.unitPrice, quote.currency)}`).join('\n')}
--------------------------------------------------
Subtotal: ${formatCurrency(subtotal, quote.currency)}
${quote.discountPercentage > 0 ? `Discount (${quote.discountPercentage}%): -${formatCurrency(discountAmount, quote.currency)}\n` : ''}${quote.taxRate > 0 ? `Tax (${quote.taxRate}%): +${formatCurrency(taxAmount, quote.currency)}\n` : ''}Grand Total: ${formatCurrency(grandTotal, quote.currency)}
--------------------------------------------------
Terms: ${quote.terms}
Notes: ${quote.notes}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // WhatsApp Click-to-Chat & Native Share Flow
  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean phone number: remove all non-numeric characters
    const cleanPhone = whatsAppPhone.replace(/\D/g, '');
    const cleanCountry = phoneCountryCode.replace(/\D/g, '');
    const fullPhone = `${cleanCountry}${cleanPhone}`;

    if (!cleanPhone) {
      alert("Please enter a valid WhatsApp phone number.");
      return;
    }

    // Generate the PDF attachment dynamically as a Blob for sharing without downloading
    const pdf = generateQuotePDF(quote, companyProfile);
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], `${quote.quoteNumber}.pdf`, { type: 'application/pdf' });

    // If native Web Share API is available with file support, share it directly (e.g. on mobile / Safari)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: `Quotation ${quote.quoteNumber}`,
          text: whatsAppMessage
        });
        setWhatsAppSuccess(true);
        if (onUpdateQuote) {
          onUpdateQuote({
            ...quote,
            status: 'Sent',
            updatedAt: new Date().toISOString()
          });
        }
        setTimeout(() => {
          setWhatsAppSuccess(false);
        }, 8000);
        return; // Success! Sent directly as an attachment without manual download.
      } catch (err) {
        console.warn('Native sharing failed or was cancelled, falling back to chat link:', err);
      }
    }

    // Fallback: Construct click-to-chat URL
    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(fullPhone)}&text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(url, '_blank');

    setWhatsAppSuccess(true);
    if (onUpdateQuote) {
      onUpdateQuote({
        ...quote,
        status: 'Sent',
        updatedAt: new Date().toISOString()
      });
    }
    setTimeout(() => {
      setWhatsAppSuccess(false);
    }, 8000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fadeIn" id="quote-preview-container">
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl flex flex-col h-[90vh]" id="quote-preview-modal-card">
        
        {/* Modal Top Action Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 z-20 rounded-t-2xl shrink-0">
          <div className="flex items-center space-x-2">
            {/* Copy Text */}
            <button
              id="btn-copy-raw-text"
              type="button"
              onClick={handleCopyText}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 transition-colors border border-slate-700 cursor-pointer shadow-sm flex items-center justify-center"
              title={copied ? 'Copied Raw Text!' : 'Copy Text'}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Print / Save */}
            <button
              id="btn-print-window"
              type="button"
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 transition-colors border border-slate-700 cursor-pointer shadow-sm flex items-center justify-center"
              title="Print Page"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Download PDF */}
            <button
              id="btn-download-pdf-modal"
              type="button"
              onClick={handleDownloadPDF}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors border border-indigo-500 cursor-pointer shadow-sm flex items-center justify-center"
              title="Download PDF"
            >
              <Download className="w-4 h-4 text-white" />
            </button>

            {/* Send Quote Toggle */}
            <button
              id="btn-send-quote-toggle"
              type="button"
              onClick={() => setShowSendOverlay(!showSendOverlay)}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center ${
                showSendOverlay
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700'
              }`}
              title="Send Quote via WhatsApp"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-close-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full-width Centered Layout for Paper Preview */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden" id="modal-panes-grid">
          
          {/* Centered Column: Interactive White Document Paper */}
          <div className="w-full flex-1 p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center lg:h-full lg:overflow-hidden custom-scrollbar pb-6 relative" id="paper-preview-column">

            {/* Slide-over / Modal Overlay for Sending WhatsApp */}
            {showSendOverlay && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-30 p-4 sm:p-6 flex flex-col overflow-y-auto custom-scrollbar animate-fadeIn" id="whatsapp-overlay-panel">
                {/* Overlay Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">WhatsApp Dispatch Settings</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowSendOverlay(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form inside overlay */}
                <form onSubmit={handleSendWhatsApp} className="space-y-4 max-w-xl mx-auto w-full" id="whatsapp-overlay-form">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Code</label>
                      <select
                        id="overlay-wa-country-select"
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 focus:border-emerald-500 rounded-xl px-2 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors font-semibold"
                      >
                        {!['+1', '+44', '+49', '+91', '+234', '+61', '+33', '+55'].includes(phoneCountryCode) && (
                          <option value={phoneCountryCode}>{phoneCountryCode}</option>
                        )}
                        <option value="+1">+1 (US/CA)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+49">+49 (DE)</option>
                        <option value="+91">+91 (IN)</option>
                        <option value="+234">+234 (NG)</option>
                        <option value="+61">+61 (AU)</option>
                        <option value="+33">+33 (FR)</option>
                        <option value="+55">+55 (BR)</option>
                      </select>
                    </div>
                    
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">WhatsApp Number</label>
                      <input
                        id="overlay-wa-phone-field"
                        type="tel"
                        required
                        value={whatsAppPhone}
                        onChange={(e) => setWhatsAppPhone(e.target.value)}
                        placeholder="555-123-4567"
                        className="w-full bg-slate-900 border border-slate-850 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Message Template</label>
                    <textarea
                      id="overlay-wa-msg-field"
                      required
                      rows={3}
                      value={whatsAppMessage}
                      onChange={(e) => setWhatsAppMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors resize-none font-sans leading-relaxed"
                    />
                  </div>

                  {/* High Fidelity Visual WhatsApp Mockup */}
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">WhatsApp Visual Preview</label>
                    
                    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex flex-col font-sans select-none">
                      <div className="bg-slate-950 border-b border-slate-800/80 px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                            {quote.clientCompany ? quote.clientCompany.substring(0, 2).toUpperCase() : 'CL'}
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-white block leading-none">{quote.clientCompany || 'Client Partner'}</span>
                            <span className="text-[8px] text-emerald-400 block leading-none mt-0.5">Online</span>
                          </div>
                        </div>
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      </div>

                      <div className="p-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 min-h-[140px] flex flex-col justify-end space-y-2">
                        <div className="max-w-[85%] self-end bg-emerald-900/90 border border-emerald-500/20 text-white rounded-2xl rounded-tr-none p-2.5 relative shadow-md">
                          <div className="bg-emerald-950/80 rounded-lg p-2 flex items-center justify-between border border-emerald-500/10 mb-2 gap-4">
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className="p-1.5 bg-rose-500/20 rounded-md border border-rose-500/30 shrink-0">
                                <FileText className="w-4 h-4 text-rose-400" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-200 block truncate">{quote.quoteNumber}.pdf</span>
                                <span className="text-[8px] text-slate-400 block font-mono">15.4 KB • PDF Document</span>
                              </div>
                            </div>
                            <div className="p-1.5 bg-emerald-800/50 hover:bg-emerald-800 text-emerald-300 rounded-full shrink-0 border border-emerald-500/10 cursor-pointer">
                              <Download className="w-3 h-3" />
                            </div>
                          </div>

                          <p className="text-[10.5px] leading-relaxed text-slate-100 pr-4 select-text">
                            {whatsAppMessage || 'Hello, please review this quote...'}
                          </p>

                          <div className="flex items-center justify-end space-x-0.5 text-[8px] text-emerald-300/60 mt-1">
                            <span>1:44 PM</span>
                            <CheckCheck className="w-3 h-3 text-emerald-400 font-bold" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {whatsAppSuccess && (
                    <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-300 flex items-start gap-2.5 animate-fadeIn">
                      <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">WhatsApp Share Initiated!</span>
                        We have prepared your quotation PDF and initiated WhatsApp. Attach the PDF directly to the chat window to share with your client seamlessly.
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSendOverlay(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-slate-700"
                    >
                      Cancel / Dismiss
                    </button>
                    <button
                      id="btn-whatsapp-dispatch-overlay"
                      type="submit"
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Attach PDF & Send</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Constrain height to exactly 65vh with scroll function */}
            <div className="w-full max-w-2xl h-[65vh] max-h-[65vh] overflow-y-auto rounded-xl border border-slate-800 bg-white shadow-2xl mb-4 custom-scrollbar relative print:h-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none" id="paper-preview-scroll-wrapper">
              <div className="w-full bg-white text-black p-4 sm:p-10 print:p-0 relative overflow-hidden min-h-fit">
              
              {/* Background Watermark */}
              {companyProfile.logo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none z-0">
                  <img 
                    src={companyProfile.logo} 
                    alt="Watermark" 
                    className="w-[336px] h-[336px] object-contain rotate-[-12deg]" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Header / Brand */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-300 relative z-10">
                <div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    {companyProfile.logo ? (
                      <img 
                        src={companyProfile.logo} 
                        alt="Company Logo" 
                        className="max-h-10 max-w-[120px] object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm">
                        {companyProfile.name ? companyProfile.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                    )}
                    <span className="font-extrabold text-xl tracking-tight text-black">{companyProfile.name}</span>
                  </div>
                  <p className="text-[11px] font-black text-black">{companyProfile.subtitle}</p>
                  <p className="text-[11px] font-bold text-black mt-0.5">{companyProfile.email} | {companyProfile.phone}</p>
                  <p className="text-[10px] font-bold text-black whitespace-pre-line mt-1 leading-normal">{companyProfile.address}</p>
                </div>

                <div className="text-right">
                  <h1 className="text-2xl font-black text-black tracking-tight uppercase">QUOTATION</h1>
                  <p className="text-xs font-mono font-bold text-black mt-1">{quote.quoteNumber}</p>
                  <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-black border border-slate-300">
                    STATUS: {quote.status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Client & Dates Info */}
              <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-300 text-[11px] relative z-10">
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase text-black tracking-wider mb-2">Prepared For:</h3>
                  <div className="space-y-1 text-black">
                    <p className="font-black text-sm text-black">{quote.clientCompany || 'Client Company'}</p>
                    <p className="font-bold text-black">{quote.clientName || 'Contact Name'}</p>
                    <p className="text-black font-bold">{quote.clientEmail || 'client@example.com'}</p>
                    <p className="text-black whitespace-pre-line leading-relaxed font-bold">{quote.clientAddress || 'Billing Address'}</p>
                  </div>
                </div>

                <div className="text-right space-y-2 text-black font-bold">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-black tracking-wider block">Issue Date:</span>
                    <span className="font-black text-black">{quote.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-black tracking-wider block">Valid Until:</span>
                    <span className="font-black text-black">{quote.validUntil}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-black tracking-wider block">Currency:</span>
                    <span className="font-mono font-black text-black">{quote.currency}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-6 relative z-10 w-full overflow-x-auto">
                <table className="w-full text-left text-xs text-black min-w-[500px]">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-black text-[10px] uppercase tracking-wider font-extrabold">
                      <th className="pb-2.5 font-black text-black">Description</th>
                      <th className="pb-2.5 font-black text-center w-12 text-black">Qty</th>
                      <th className="pb-2.5 font-black text-right w-24 text-black">Unit Price</th>
                      <th className="pb-2.5 font-black text-right w-24 text-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {quote.items.map((item) => {
                      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                      return (
                        <tr key={item.id} className="border-b border-slate-200">
                          <td className="py-3.5 pr-3 text-black font-bold leading-relaxed">{item.description}</td>
                          <td className="py-3.5 px-1 text-center text-black font-extrabold">{item.quantity}</td>
                          <td className="py-3.5 px-1 text-right text-black font-mono font-extrabold">{formatCurrency(item.unitPrice, quote.currency)}</td>
                          <td className="py-3.5 pl-1 text-right text-black font-mono font-black">{formatCurrency(itemTotal, quote.currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end pt-3 border-t border-slate-300 relative z-10">
                <div className="w-64 space-y-1.5 text-xs text-black">
                  <div className="flex justify-between font-bold text-black">
                    <span>Subtotal:</span>
                    <span className="font-mono font-black text-black">{formatCurrency(subtotal, quote.currency)}</span>
                  </div>
                  {quote.discountPercentage > 0 && (
                    <div className="flex justify-between text-black font-extrabold">
                      <span>Discount ({quote.discountPercentage}%):</span>
                      <span className="font-mono font-black text-black">-{formatCurrency(discountAmount, quote.currency)}</span>
                    </div>
                  )}
                  {quote.taxRate > 0 && (
                    <div className="flex justify-between font-bold text-black">
                      <span>Tax ({quote.taxRate}%):</span>
                      <span className="font-mono font-black text-black">+{formatCurrency(taxAmount, quote.currency)}</span>
                    </div>
                  )}
                  <div className="pt-2.5 border-t-2 border-slate-900 flex justify-between text-black font-black text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-black">{formatCurrency(grandTotal, quote.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Terms - Notes are completely removed as requested */}
              {quote.terms && (
                <div className="mt-8 pt-6 border-t border-slate-300 relative z-10 text-[11px] text-black">
                  <h4 className="font-extrabold uppercase tracking-wider text-black mb-1.5">Terms & Conditions:</h4>
                  <p className="leading-relaxed whitespace-pre-line font-bold text-black">{quote.terms}</p>
                </div>
              )}

              {/* Signature Block */}
              <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-[10px] relative z-10">
                <div>
                  <div className="font-mono text-center text-black text-xs mb-1 italic h-8 flex items-end justify-center select-all font-bold">
                    {companyProfile.signatoryName}
                  </div>
                  <div className="border-b-2 border-slate-900 pb-1 mb-1"></div>
                  <p className="font-black text-black uppercase tracking-wider">Authorised Name & Signature</p>
                  <p className="text-black font-bold">{companyProfile.signatoryTitle}</p>
                </div>
                <div>
                  <div className="h-8"></div>
                  <div className="border-b-2 border-slate-900 pb-1 mb-1"></div>
                  <p className="font-black text-black uppercase">Client Acceptance Signature</p>
                  <p className="text-black font-bold">Authorized Signatory</p>
                </div>
              </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
