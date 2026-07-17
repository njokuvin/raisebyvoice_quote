import React, { useState, useRef, useEffect } from 'react';
import { Mic, Plus, FileText, HelpCircle, FolderOpen, Sparkles, SlidersHorizontal, MoreVertical } from 'lucide-react';
import { Quotation } from '../types';

interface HeaderProps {
  currentQuote: Quotation;
  onNewQuote: () => void;
  onOpenList: () => void;
  onOpenPreview: () => void;
  onOpenHelp: () => void;
  isListening: boolean;
  onToggleListening: () => void;
  aiLoading: boolean;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentQuote,
  onNewQuote,
  onOpenList,
  onOpenPreview,
  onOpenHelp,
  isListening,
  onToggleListening,
  aiLoading,
  onToggleMobileSidebar,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 sm:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-10 shrink-0 z-30 sticky top-0 shadow-sm">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          title="Toggle Voice Assistant Sidebar"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-sm flex items-center justify-center shadow-md shadow-indigo-600/20">
          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white rotate-45"></div>
        </div>
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight uppercase text-slate-800 flex items-center gap-2">
            RaisebyVoice_Quote <span className="font-light text-slate-400 text-xs sm:text-base">v2.4</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold hidden sm:block">
            Natural Language Quotation Studio
          </p>
        </div>
      </div>

      {/* Right Actions & Reference */}
      <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
        
        {/* Draft Reference info */}
        <div className="text-right hidden md:block">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Active Reference</p>
          <p className="font-mono text-sm font-medium text-slate-800">{currentQuote.quoteNumber}</p>
        </div>

        <div className="w-px h-8 bg-slate-200 hidden md:block"></div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          
          {/* Voice Mic Quick Toggle */}
          <button
            onClick={onToggleListening}
            disabled={aiLoading}
            id="mic-toggle-btn"
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
            }`}
            title="Click to speak quotation details or edits"
          >
            <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">
              {isListening ? 'Listening...' : 'Voice Dictate'}
            </span>
          </button>

          {/* Desktop/Tablet Buttons (Hidden on mobile < sm) */}
          <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-2" id="desktop-action-buttons">
            {/* Saved Quotes */}
            <button
              onClick={onOpenList}
              id="saved-quotes-btn"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest transition-colors border border-slate-200"
              title="Browse all quotations"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden xl:inline">Saved Quotes</span>
            </button>

            {/* Preview & PDF */}
            <button
              onClick={onOpenPreview}
              id="preview-pdf-btn"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest transition-colors border border-slate-200"
              title="Preview & Print PDF"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Preview PDF</span>
            </button>

            {/* New Quote */}
            <button
              onClick={onNewQuote}
              id="new-quote-btn"
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-lg"
              title="Create New Quote"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Quote</span>
            </button>

            {/* Help */}
            <button
              onClick={onOpenHelp}
              id="help-btn"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200"
              title="Voice Commands Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Actions Dropdown (Only visible on mobile < sm) */}
          <div className="relative sm:hidden" ref={dropdownRef} id="mobile-action-dropdown">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              id="mobile-dropdown-trigger"
              className="flex items-center justify-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 shadow-sm"
              title="More Actions"
            >
              <MoreVertical className="w-4 h-4 text-slate-700" />
            </button>

            {isDropdownOpen && (
              <div 
                id="mobile-dropdown-menu"
                className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* New Quote */}
                <button
                  onClick={() => {
                    onNewQuote();
                    setIsDropdownOpen(false);
                  }}
                  id="mobile-new-quote-btn"
                  className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-slate-900" />
                  <span>New Quote</span>
                </button>

                {/* Preview & PDF */}
                <button
                  onClick={() => {
                    onOpenPreview();
                    setIsDropdownOpen(false);
                  }}
                  id="mobile-preview-pdf-btn"
                  className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Preview PDF</span>
                </button>

                {/* Saved Quotes */}
                <button
                  onClick={() => {
                    onOpenList();
                    setIsDropdownOpen(false);
                  }}
                  id="mobile-saved-quotes-btn"
                  className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                >
                  <FolderOpen className="w-4 h-4 text-indigo-600" />
                  <span>Saved Quotes</span>
                </button>

                {/* Help Guide */}
                <button
                  onClick={() => {
                    onOpenHelp();
                    setIsDropdownOpen(false);
                  }}
                  id="mobile-help-btn"
                  className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                >
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>Help Guide</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

