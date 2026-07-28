import React, { useState, useEffect } from 'react';
import { ActiveService, Quotation, VoiceLogEntry, CompanyProfile } from './types';
import { sampleQuotes } from './data/sampleQuotes';
import { generateNewQuoteId, generateQuoteNumber, updateLastQuoteNumberCache } from './utils/quoteUtils';

// Shared Facility Components
import { SharedHeader, SharingFacility, MeasurementModal, SidebarVoiceAssistant, VoiceHelpModal } from './components/SharedFacility';

// Startup Service Hub
import { ServiceHub } from './components/StartupPage/ServiceHub';

// 5 Service Modules
import { QuotationService } from './components/Services/QuotationService';
import { BoqService } from './components/Services/BoqService';
import { InventoryService } from './components/Services/InventoryService';
import { InvoiceService } from './components/Services/InvoiceService';
import { ReportService } from './components/Services/ReportService';

export default function App() {
  // Navigation State: Startup Page ('hub') or one of 5 Services ('quotation', 'boq', 'inventory', 'invoice', 'report')
  const [activeService, setActiveService] = useState<ActiveService>('hub');

  // Quotation State
  const [quotes, setQuotes] = useState<Quotation[]>(() => {
    try {
      const saved = localStorage.getItem('voicequota_quotes_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading quotes from localStorage:', e);
    }
    return sampleQuotes;
  });

  const [currentQuoteId, setCurrentQuoteId] = useState<string>(() => quotes[0]?.id || sampleQuotes[0].id);

  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const defaultProfile: CompanyProfile = {
      name: 'RaisebyVoice',
      subtitle: 'Multilingual Business Services & Consulting',
      email: 'support@raisebyvoice.io',
      phone: '',
      address: '123 Corporate Blvd, Suite 400\nNew York, NY 10001',
      logo: '',
      signatoryName: '',
      signatoryTitle: 'Managing Director',
      whatsapp: '',
      country: 'Nigeria',
    };

    try {
      const saved = localStorage.getItem('voicequota_company_profile_v2');
      if (saved) {
        return {
          ...defaultProfile,
          ...JSON.parse(saved),
        };
      }
    } catch (e) {
      console.error('Error loading company profile:', e);
    }
    return defaultProfile;
  });

  // Save company profile on change
  useEffect(() => {
    try {
      localStorage.setItem('voicequota_company_profile_v2', JSON.stringify(companyProfile));
    } catch (e) {
      console.error('Error saving company profile:', e);
    }
  }, [companyProfile]);

  // UI Modals & State
  const [isListOpen, setIsListOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLogEntry[]>([]);

  const handleApplyMeasurement = (valStr: string, numericVal: number) => {
    if (activeService === 'quotation' && currentQuote) {
      const newItem = {
        id: 'item-meas-' + Date.now().toString(36),
        description: `AR Measured Dimension (${valStr})`,
        quantity: Math.max(1, Math.round(numericVal)),
        unitPrice: 100,
      };
      const updatedQuote = {
        ...currentQuote,
        items: [...(currentQuote.items || []), newItem],
        updatedAt: new Date().toISOString(),
      };
      updateCurrentQuote(updatedQuote);
      setLastExplanation(`Added AR measurement line item (${valStr}) to quote.`);
    }
  };

  // Sharing Facility State
  const [shareData, setShareData] = useState({
    title: 'Business Document',
    refNum: 'DOC-001',
    summaryText: 'Summary details',
  });

  // Company Validation State
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>([]);

  const validateRequiredFields = (): boolean => {
    const missing: string[] = [];
    if (!companyProfile.phone || !companyProfile.phone.trim()) {
      missing.push('Company Phone');
    }
    if (!companyProfile.whatsapp || !companyProfile.whatsapp.trim()) {
      missing.push('Company WhatsApp');
    }
    if (!companyProfile.signatoryName || !companyProfile.signatoryName.trim()) {
      missing.push('Authorized Signatory Name');
    }

    if (missing.length > 0) {
      setMissingRequiredFields(missing);
      setShowValidationAlert(true);
      return false;
    }

    setMissingRequiredFields([]);
    setShowValidationAlert(false);
    return true;
  };

  const handleOpenPreview = () => {
    if (validateRequiredFields()) {
      setIsPreviewOpen(true);
    }
  };

  const handleOpenShareModal = (title?: string, refNum?: string, summaryText?: string) => {
    if (title && refNum && summaryText) {
      setShareData({ title, refNum, summaryText });
    } else {
      // Default to active quote
      const currentQ = quotes.find((q) => q.id === currentQuoteId) || quotes[0];
      const itemsText = (currentQ.items || []).map(i => `- ${i.description}: ${i.quantity} x ${currentQ.currency} ${i.unitPrice}`).join('\n');
      setShareData({
        title: 'Quotation Estimate',
        refNum: currentQ.quoteNumber,
        summaryText: `Quotation: ${currentQ.quoteNumber}\nClient: ${currentQ.clientName || 'N/A'}\nItems:\n${itemsText}\nValid Until: ${currentQ.validUntil}`,
      });
    }
    setIsShareModalOpen(true);
  };

  // Sync quotes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voicequota_quotes_v1', JSON.stringify(quotes));
      updateLastQuoteNumberCache(quotes);
    } catch (e) {
      console.error('Error saving quotes to localStorage:', e);
    }
  }, [quotes]);

  const currentQuote = quotes.find((q) => q.id === currentQuoteId) || quotes[0] || sampleQuotes[0];

  const createNewQuoteInternal = (customExplanation?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    updateLastQuoteNumberCache(quotes);

    const newQuote: Quotation = {
      id: generateNewQuoteId(),
      quoteNumber: generateQuoteNumber(),
      status: 'Draft',
      clientName: '',
      clientEmail: '',
      clientCompany: '',
      clientAddress: '',
      issueDate: today,
      validUntil: validDate,
      currency: 'NGN',
      items: [
        {
          id: 'item-' + Math.random().toString(36).substring(2, 8),
          description: '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
      taxRate: 0,
      discountPercentage: 0,
      setupCharge: 10,
      serviceCharge: 20,
      notes: '',
      terms: 'payment within validity period before service',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuotes((prev) => [newQuote, ...prev]);
    setCurrentQuoteId(newQuote.id);
    setActiveService('quotation');
    setLastExplanation(customExplanation || `Created new quotation ${newQuote.quoteNumber}.`);
    return newQuote;
  };

  const handleNewQuote = () => {
    createNewQuoteInternal('Created a new blank quotation.');
  };

  const updateCurrentQuote = (updated: Quotation) => {
    const isSentTransition = currentQuote.id === updated.id && currentQuote.status !== 'Sent' && updated.status === 'Sent';
    const updatedQuotesList = quotes.map((q) => (q.id === updated.id ? updated : q));
    setQuotes(updatedQuotesList);

    if (isSentTransition) {
      updateLastQuoteNumberCache(updatedQuotesList);
      createNewQuoteInternal(
        `Quotation ${updated.quoteNumber} marked as Sent. Opened new serial quote.`
      );
    }
  };

  const handleDeleteQuote = (id: string) => {
    const remaining = quotes.filter((q) => q.id !== id);
    if (remaining.length === 0) {
      handleNewQuote();
      return;
    }
    setQuotes(remaining);
    if (currentQuoteId === id) {
      setCurrentQuoteId(remaining[0].id);
    }
  };

  const handleDuplicateQuote = (quote: Quotation) => {
    const duplicated: Quotation = {
      ...quote,
      id: generateNewQuoteId(),
      quoteNumber: generateQuoteNumber(),
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setQuotes((prev) => [duplicated, ...prev]);
    setCurrentQuoteId(duplicated.id);
    setActiveService('quotation');
    setLastExplanation(`Duplicated quote ${quote.quoteNumber} as ${duplicated.quoteNumber}.`);
  };

  const mergeQuoteData = (data: any, current: Quotation): Quotation => {
    return {
      ...current,
      quoteNumber: data.quoteNumber || current.quoteNumber,
      clientName: data.clientName !== undefined ? data.clientName : current.clientName,
      clientEmail: data.clientEmail !== undefined ? data.clientEmail : current.clientEmail,
      clientCompany: data.clientCompany !== undefined ? data.clientCompany : current.clientCompany,
      clientAddress: data.clientAddress !== undefined ? data.clientAddress : current.clientAddress,
      issueDate: data.issueDate || current.issueDate,
      validUntil: data.validUntil || current.validUntil,
      currency: data.currency || current.currency,
      items: Array.isArray(data.items)
        ? data.items.map((i: any, idx: number) => ({
            id: i.id || `item-ai-${idx}-${Date.now()}`,
            description: i.description || 'Service item',
            quantity: typeof i.quantity === 'number' ? i.quantity : 1,
            unitPrice: typeof i.unitPrice === 'number' ? i.unitPrice : 0,
          }))
        : current.items,
      taxRate: typeof data.taxRate === 'number' ? data.taxRate : current.taxRate,
      discountPercentage: typeof data.discountPercentage === 'number' ? data.discountPercentage : current.discountPercentage,
      notes: data.notes !== undefined ? data.notes : current.notes,
      terms: data.terms !== undefined ? data.terms : current.terms,
      updatedAt: new Date().toISOString(),
    };
  };

  const handleApplyLiveUpdate = (data: any) => {
    setQuotes((prevQuotes) => {
      return prevQuotes.map((q) => {
        if (q.id === currentQuoteId) {
          return mergeQuoteData(data, q);
        }
        return q;
      });
    });
  };

  // Natural Language Voice Processing Handler
  const handleProcessTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;

    const lower = transcript.toLowerCase();

    // Check for service navigation commands in Hausa or English
    if (lower.includes('boq') || lower.includes('bill of quantities')) {
      setActiveService('boq');
      setLastExplanation('Switched to BOQ Studio via voice.');
      return;
    }
    if (lower.includes('inventory') || lower.includes('stock') || lower.includes('kaya')) {
      setActiveService('inventory');
      setLastExplanation('Switched to Inventory Manager via voice.');
      return;
    }
    if (lower.includes('invoice') || lower.includes('invoicing')) {
      setActiveService('invoice');
      setLastExplanation('Switched to Invoice Generator via voice.');
      return;
    }
    if (lower.includes('report') || lower.includes('analytics') || lower.includes('summary')) {
      setActiveService('report');
      setLastExplanation('Switched to Report Builder via voice.');
      return;
    }
    if (lower.includes('quote') || lower.includes('quotation') || lower.includes('home') || lower.includes('hub')) {
      if (lower.includes('home') || lower.includes('hub')) {
        setActiveService('hub');
        setLastExplanation('Returned to Service Hub via voice.');
        return;
      }
      setActiveService('quotation');
    }

    setAiLoading(true);
    setLastExplanation(null);

    try {
      const res = await fetch('/api/parse-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          currentQuote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process voice request.');
      }

      const updatedQuote = mergeQuoteData(data, currentQuote);
      updateCurrentQuote(updatedQuote);

      const explanationText = data.explanation || 'Updated successfully via Gemini voice.';
      setLastExplanation(explanationText);

      setVoiceLogs((prev) => [
        {
          id: 'log-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          transcript,
          explanation: explanationText,
          type: 'success',
        },
        ...prev.slice(0, 19),
      ]);
    } catch (err: any) {
      console.error('Error processing transcript:', err);
      const errorMsg = err.message || 'Error processing speech command.';
      setLastExplanation(`Error: ${errorMsg}`);
      setVoiceLogs((prev) => [
        {
          id: 'log-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          transcript,
          explanation: errorMsg,
          type: 'error',
        },
        ...prev.slice(0, 19),
      ]);
    } flex: {
      setAiLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden selection:bg-indigo-600 selection:text-white">
      
      {/* Top Header - Shared across Hub and all 5 Services */}
      <SharedHeader
        activeService={activeService}
        onNavigateService={(srv) => {
          setActiveService(srv);
          setIsMobileSidebarOpen(false);
        }}
        currentQuote={currentQuote}
        onNewQuote={handleNewQuote}
        onOpenList={() => setIsListOpen(true)}
        onOpenPreview={handleOpenPreview}
        onOpenShareModal={() => handleOpenShareModal()}
        onOpenHelp={() => setIsHelpOpen(true)}
        isListening={isListening}
        onToggleListening={() => setIsListening(!isListening)}
        aiLoading={aiLoading}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Body: Shared Gemini Voice Assistant Sidebar + Active Service Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          />
        )}

        {/* Left Sidebar: Shared Voice Assistant (Gemini Live) */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transform ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:relative transition-transform duration-300 ease-in-out shrink-0 bg-white shadow-xl lg:shadow-none`}
        >
          <SidebarVoiceAssistant
            onProcessTranscript={async (text) => {
              await handleProcessTranscript(text);
              setIsMobileSidebarOpen(false);
            }}
            aiLoading={aiLoading}
            lastExplanation={lastExplanation}
            isListening={isListening}
            setIsListening={setIsListening}
            voiceLogs={voiceLogs}
            onOpenHelp={() => {
              setIsHelpOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            currentQuote={currentQuote}
            onApplyLiveUpdate={handleApplyLiveUpdate}
            onAddVoiceLog={(log) => setVoiceLogs((prev) => [log, ...prev.slice(0, 19)])}
          />
        </div>

        {/* Active Workspace View */}
        <main className="flex-1 w-full bg-slate-50 flex flex-col overflow-hidden">
          {activeService === 'hub' && (
            <ServiceHub
              onSelectService={(srv) => setActiveService(srv)}
              onStartVoice={() => setIsListening(true)}
              isListening={isListening}
              currentQuote={currentQuote}
            />
          )}

          {activeService === 'quotation' && (
            <QuotationService
              quote={currentQuote}
              quotes={quotes}
              currentQuoteId={currentQuoteId}
              onUpdateQuote={updateCurrentQuote}
              onSelectQuote={setCurrentQuoteId}
              onNewQuote={handleNewQuote}
              onDeleteQuote={handleDeleteQuote}
              onDuplicateQuote={handleDuplicateQuote}
              companyProfile={companyProfile}
              onUpdateCompanyProfile={setCompanyProfile}
              isListOpen={isListOpen}
              setIsListOpen={setIsListOpen}
              isPreviewOpen={isPreviewOpen}
              setIsPreviewOpen={setIsPreviewOpen}
              showValidationAlert={showValidationAlert}
              missingRequiredFields={missingRequiredFields}
              onDismissValidationAlert={() => setShowValidationAlert(false)}
              onOpenMeasurement={() => setIsMeasurementOpen(true)}
            />
          )}

          {activeService === 'boq' && (
            <BoqService
              companyProfile={companyProfile}
              onOpenShareModal={(title, refNum, summary) => handleOpenShareModal(title, refNum, summary)}
              onOpenMeasurement={() => setIsMeasurementOpen(true)}
            />
          )}

          {activeService === 'inventory' && (
            <InventoryService
              companyProfile={companyProfile}
              onOpenShareModal={(title, refNum, summary) => handleOpenShareModal(title, refNum, summary)}
            />
          )}

          {activeService === 'invoice' && (
            <InvoiceService
              companyProfile={companyProfile}
              onOpenShareModal={(title, refNum, summary) => handleOpenShareModal(title, refNum, summary)}
            />
          )}

          {activeService === 'report' && (
            <ReportService
              companyProfile={companyProfile}
              onOpenShareModal={(title, refNum, summary) => handleOpenShareModal(title, refNum, summary)}
              onOpenMeasurement={() => setIsMeasurementOpen(true)}
            />
          )}
        </main>

      </div>

      {/* Shared Modals */}
      <SharingFacility
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeService={activeService}
        documentTitle={shareData.title}
        documentNumber={shareData.refNum}
        clientName={currentQuote.clientName}
        clientEmail={currentQuote.clientEmail}
        summaryText={shareData.summaryText}
        companyProfile={companyProfile}
        onTriggerPdfExport={handleOpenPreview}
      />

      {/* <MeasurementModal
        isOpen={isMeasurementOpen}
        onClose={() => setIsMeasurementOpen(false)}
        onApplyMeasurement={handleApplyMeasurement}
      /> */}

      <VoiceHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

    </div>
  );
}
