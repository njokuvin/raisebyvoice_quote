import React, { useState, useEffect } from 'react';
import { Quotation, VoiceLogEntry, CompanyProfile } from './types';
import { sampleQuotes } from './data/sampleQuotes';
import { generateNewQuoteId, generateQuoteNumber, updateLastQuoteNumberCache } from './utils/quoteUtils';
import { Header } from './components/Header';
import { SidebarVoiceAssistant } from './components/SidebarVoiceAssistant';
import { QuoteEditor } from './components/QuoteEditor';
import { QuoteListDrawer } from './components/QuoteListDrawer';
import { QuotePreviewModal } from './components/QuotePreviewModal';
import { VoiceHelpModal } from './components/VoiceHelpModal';

export default function App() {
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
  
  // Customizable Company Profile State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const defaultProfile: CompanyProfile = {
      name: 'RaisebyVoice_Quote',
      subtitle: 'Professional Services & Consulting',
      email: 'support@raisebyvoice.io',
      phone: '+1 (555) 987-6543',
      address: '123 Corporate Blvd, Suite 400\nNew York, NY 10001',
      logo: '', // Base64 data URL
      signatoryName: 'Jane Doe',
      signatoryTitle: 'Managing Director',
      whatsapp: '555-987-6543',
      country: 'United States',
    };

    try {
      const saved = localStorage.getItem('voicequota_company_profile_v2');
      if (saved) {
        return {
          ...defaultProfile,
          ...JSON.parse(saved)
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
  
  // Modals & UI state
  const [isListOpen, setIsListOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLogEntry[]>([]);

  // Save quotes to localStorage on change and update highest serial cache
  useEffect(() => {
    try {
      localStorage.setItem('voicequota_quotes_v1', JSON.stringify(quotes));
      updateLastQuoteNumberCache(quotes);
    } catch (e) {
      console.error('Error saving quotes to localStorage:', e);
    }
  }, [quotes]);

  const currentQuote = quotes.find((q) => q.id === currentQuoteId) || quotes[0] || sampleQuotes[0];

  const updateCurrentQuote = (updated: Quotation) => {
    setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  const handleNewQuote = () => {
    const today = new Date().toISOString().split('T')[0];
    const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
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
        }
      ],
      taxRate: 0,
      discountPercentage: 0,
      notes: '',
      terms: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuotes((prev) => [newQuote, ...prev]);
    setCurrentQuoteId(newQuote.id);
    setLastExplanation('Created a new blank quotation.');
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
      items: data.items && data.items.length > 0 ? data.items.map((i: any, idx: number) => ({
        id: i.id || `item-ai-${idx}-${Date.now()}`,
        description: i.description || 'Service item',
        quantity: typeof i.quantity === 'number' ? i.quantity : 1,
        unitPrice: typeof i.unitPrice === 'number' ? i.unitPrice : 0,
      })) : current.items,
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

  // Process natural language transcript / voice command via backend API
  const handleProcessTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;

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

      // Merge parsed data into current quote
      const updatedQuote = mergeQuoteData(data, currentQuote);

      updateCurrentQuote(updatedQuote);
      const explanationText = data.explanation || 'Quotation updated successfully via voice.';
      setLastExplanation(explanationText);

      // Add to voice logs
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
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden selection:bg-indigo-600 selection:text-white">
      
      {/* Top Header */}
      <Header
        currentQuote={currentQuote}
        onNewQuote={handleNewQuote}
        onOpenList={() => setIsListOpen(true)}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        isListening={isListening}
        onToggleListening={() => {
          setIsListening(!isListening);
        }}
        aiLoading={aiLoading}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Middle Layout: Sidebar + Main Editor */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          />
        )}

        {/* Left Sidebar: Voice Assistant & History (Drawer on mobile, Sidebar on desktop) */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transform ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:relative transition-transform duration-300 ease-in-out shrink-0 bg-white shadow-xl lg:shadow-none`}
        >
          <SidebarVoiceAssistant
            onProcessTranscript={(text) => {
              handleProcessTranscript(text);
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

        {/* Main Editor Area - Full width on mobile, taking remaining space on desktop */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-10 bg-slate-50 flex flex-col overflow-y-auto">
          <QuoteEditor
            quote={currentQuote}
            onUpdateQuote={updateCurrentQuote}
            companyProfile={companyProfile}
            onUpdateCompanyProfile={setCompanyProfile}
            onDeleteQuote={handleDeleteQuote}
          />
        </main>

      </div>

      {/* Modals */}
      <QuoteListDrawer
        isOpen={isListOpen}
        onClose={() => setIsListOpen(false)}
        quotes={quotes}
        currentQuoteId={currentQuoteId}
        onSelectQuote={setCurrentQuoteId}
        onNewQuote={handleNewQuote}
        onDeleteQuote={handleDeleteQuote}
        onDuplicateQuote={handleDuplicateQuote}
      />

      <QuotePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        quote={currentQuote}
        companyProfile={companyProfile}
        onUpdateQuote={updateCurrentQuote}
      />

      <VoiceHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

    </div>
  );
}
