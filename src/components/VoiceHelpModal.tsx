import React from 'react';
import { X, Mic, Sparkles, CheckCircle2, MessageSquare, Layers } from 'lucide-react';

interface VoiceHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceHelpModal: React.FC<VoiceHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-lg text-white">Voice & Form Fields Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-300 overflow-y-auto flex-1">
          <p>
            RaisebyVoice_Quote uses Gemini AI to understand natural spoken or typed instructions, matching form field names and filling them out instantly. You can also clear any field by saying e.g. <span className="font-mono text-indigo-300">"clear client name"</span>.
          </p>

          {/* Form Fields List */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Available Quotation Form Fields:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: 'clientName', label: 'Client Name', desc: 'Name of the client contact or person' },
                { name: 'clientCompany', label: 'Client Company', desc: 'Organization or company name' },
                { name: 'clientEmail', label: 'Client Email', desc: 'Email address for communications' },
                { name: 'clientAddress', label: 'Client Address', desc: 'Billing or mailing address' },
                { name: 'quoteNumber', label: 'Quote Number', desc: 'Unique identifier code (e.g. QT-2026-001)' },
                { name: 'issueDate', label: 'Issue Date', desc: 'Date when quote is issued (YYYY-MM-DD)' },
                { name: 'dueDate', label: 'Due Date / Valid Until', desc: 'Expiration or payment due date' },
                { name: 'status', label: 'Status', desc: 'Draft, Sent, Accepted, or Rejected' },
                { name: 'currency', label: 'Currency', desc: 'USD ($), EUR (€), GBP (£), CAD ($), etc.' },
                { name: 'discountPercentage', label: 'Discount (%)', desc: 'Percentage discount applied to subtotal' },
                { name: 'taxRate', label: 'Tax Rate (%)', desc: 'Sales tax or VAT percentage' },
                { name: 'notes', label: 'Notes', desc: 'Additional notes or remarks for the client' },
                { name: 'terms', label: 'Payment Terms', desc: 'Payment conditions (e.g. Net 30, Due on Receipt)' },
                { name: 'items', label: 'Line Items', desc: 'Description, quantity, and unit price for products/services' },
              ].map((field, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs">{field.label}</span>
                    <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/50">{field.name}</span>
                  </div>
                  <p className="text-slate-400 text-xs">{field.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Mic className="w-4 h-4 text-rose-500" />
              Example Voice Commands & Hausa Translation:
            </h3>

            <div className="grid gap-3">
              {[
                {
                  title: 'Hausa Speech Auto-Translated to English',
                  example: '"Kamfanin shine Cyberdyne Systems, sunan aboki shine Ali Bello" -> Translates & sets Client Company: Cyberdyne Systems, Client Name: Ali Bello'
                },
                {
                  title: 'Hausa Items & Discounts',
                  example: '"Saka rangwame na kashi 10% sannan kara kaya guda 5 a kan dala 100" -> Applies 10% discount and adds 5 x $100 items.'
                },
                {
                  title: 'Clear Any Form Field (English or Hausa)',
                  example: '"Clear client email" or "Goge sunan aboki" or "Goge rangwame" or "Clear tax"'
                },
                {
                  title: 'Duplicate Word Prevention',
                  example: 'AI and editor automatically clean up accidental duplicate words (e.g. "Net 30 Net 30" -> "Net 30").'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="font-semibold text-indigo-300 text-xs uppercase tracking-wider">{item.title}</span>
                  <p className="text-slate-200 italic font-mono text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {item.example}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Tip: </span>
              Click the microphone button to dictate naturally or type commands in the assistant sidebar!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-md"
          >
            Got it, Let&apos;s Start
          </button>
        </div>

      </div>
    </div>
  );
};
