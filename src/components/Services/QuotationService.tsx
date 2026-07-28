import React, { useState } from 'react';
import { Plus, FolderOpen, FileText, ChevronDown, Check } from 'lucide-react';
import { Quotation, CompanyProfile } from '../../types';
import { QuoteEditor } from '../QuoteEditor';
import { QuoteListDrawer } from '../QuoteListDrawer';
import { QuotePreviewModal } from '../QuotePreviewModal';

interface QuotationServiceProps {
  quote: Quotation;
  quotes: Quotation[];
  currentQuoteId: string;
  onUpdateQuote: (quote: Quotation) => void;
  onSelectQuote: (id: string) => void;
  onNewQuote: () => void;
  onDeleteQuote: (id: string) => void;
  onDuplicateQuote: (quote: Quotation) => void;
  companyProfile: CompanyProfile;
  onUpdateCompanyProfile: (profile: CompanyProfile) => void;
  isListOpen: boolean;
  setIsListOpen: (open: boolean) => void;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  showValidationAlert: boolean;
  missingRequiredFields: string[];
  onDismissValidationAlert: () => void;
  onOpenMeasurement?: () => void;
}

export const QuotationService: React.FC<QuotationServiceProps> = ({
  quote,
  quotes,
  currentQuoteId,
  onUpdateQuote,
  onSelectQuote,
  onNewQuote,
  onDeleteQuote,
  onDuplicateQuote,
  companyProfile,
  onUpdateCompanyProfile,
  isListOpen,
  setIsListOpen,
  isPreviewOpen,
  setIsPreviewOpen,
  showValidationAlert,
  missingRequiredFields,
  onDismissValidationAlert,
  onOpenMeasurement,
}) => {
  const [isJustCreated, setIsJustCreated] = useState(false);

  const handleNewClick = () => {
    onNewQuote();
    setIsJustCreated(true);
    setTimeout(() => {
      setIsJustCreated(false);
    }, 1500);
  };

  return (
    <div className="flex-1 w-full p-4 sm:p-6 lg:p-10 bg-slate-50 flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Top Action Bar for Quotation Management */}
      <div className="mb-4 flex items-center justify-end gap-2">
        {/* Create New Quotation Button */}
        <button
          onClick={handleNewClick}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-xs cursor-pointer active:scale-95 whitespace-nowrap ${
            isJustCreated
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-105'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
          title="Create a new blank quotation"
        >
          {isJustCreated ? (
            <>
              <Check className="w-3.5 h-3.5 text-white animate-bounce" />
              <span>Created!</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New</span>
            </>
          )}
        </button>

        {/* Saved Quotes Menu Button */}
        <button
          onClick={() => setIsListOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          title="Open menu holding all saved quotations"
        >
          <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Saved</span>
        </button>
      </div>

      <QuoteEditor
        quote={quote}
        onUpdateQuote={onUpdateQuote}
        companyProfile={companyProfile}
        onUpdateCompanyProfile={onUpdateCompanyProfile}
        onDeleteQuote={onDeleteQuote}
        onSendQuote={() => setIsPreviewOpen(true)}
        showValidationAlert={showValidationAlert}
        missingRequiredFields={missingRequiredFields}
        onDismissValidationAlert={onDismissValidationAlert}
        onOpenMeasurement={onOpenMeasurement}
      />

      <QuoteListDrawer
        isOpen={isListOpen}
        onClose={() => setIsListOpen(false)}
        quotes={quotes}
        currentQuoteId={currentQuoteId}
        onSelectQuote={onSelectQuote}
        onNewQuote={onNewQuote}
        onDeleteQuote={onDeleteQuote}
        onDuplicateQuote={onDuplicateQuote}
      />

      <QuotePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        quote={quote}
        companyProfile={companyProfile}
        onUpdateQuote={onUpdateQuote}
      />
    </div>
  );
};
