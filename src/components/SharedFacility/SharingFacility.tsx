import React, { useState } from 'react';
import { Share2, Download, Send, Copy, Printer, Check, X, Mail, MessageSquare } from 'lucide-react';
import { ActiveService, CompanyProfile } from '../../types';

interface SharingFacilityProps {
  isOpen: boolean;
  onClose: () => void;
  activeService: ActiveService;
  documentTitle: string;
  documentNumber: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  summaryText: string;
  companyProfile: CompanyProfile;
  onTriggerPdfExport?: () => void;
}

export const SharingFacility: React.FC<SharingFacilityProps> = ({
  isOpen,
  onClose,
  activeService,
  documentTitle,
  documentNumber,
  clientName,
  clientEmail,
  clientPhone,
  summaryText,
  companyProfile,
  onTriggerPdfExport,
}) => {
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`*${companyProfile.name || 'RaisebyVoice'} - ${documentTitle}*\nReference: ${documentNumber}\nClient: ${clientName || 'N/A'}\n\n${summaryText}`);
    const phone = clientPhone ? clientPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${documentTitle} [${documentNumber}] - ${companyProfile.name}`);
    const body = encodeURIComponent(`Dear ${clientName || 'Valued Customer'},\n\nPlease find the details for your ${documentTitle} (${documentNumber}) below:\n\n${summaryText}\n\nThank you,\n${companyProfile.signatoryName || companyProfile.name}\n${companyProfile.phone}`);
    const mailto = `mailto:${clientEmail || ''}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="sharing-facility-modal">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">Shared Sharing Facility</h3>
              <p className="text-xs text-slate-300 font-mono">
                {documentTitle} • {documentNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Actions */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Quick Sharing Grid */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Download PDF */}
            <button
              onClick={() => {
                if (onTriggerPdfExport) onTriggerPdfExport();
                onClose();
              }}
              className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 group-hover:text-emerald-800">Download PDF</span>
              <span className="text-[10px] text-slate-500 mt-0.5">High-res formatted PDF</span>
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 group-hover:text-emerald-800">WhatsApp Export</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Send directly via WhatsApp</span>
            </button>

            {/* Email Client */}
            <button
              onClick={handleEmailShare}
              className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 group-hover:text-indigo-800">Email Document</span>
              <span className="text-[10px] text-slate-500 mt-0.5">{clientEmail || 'Send via Mail app'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Print Paper Copy</span>
              <span className="text-[10px] text-slate-500 mt-0.5">System print dialog</span>
            </button>

          </div>

          {/* Copy Summary Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Document Summary Preview</span>
              <button
                onClick={handleCopySummary}
                className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              readOnly
              value={summaryText}
              rows={4}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-700 focus:outline-none resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
