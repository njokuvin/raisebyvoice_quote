import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, Plus, FileText, HelpCircle, FolderOpen, SlidersHorizontal, 
  MoreVertical, Home, Layers, Boxes, Receipt, BarChart3, ChevronDown, Share2
} from 'lucide-react';
import { ActiveService, Quotation } from '../../types';
import { User as FirebaseUser } from 'firebase/auth';
import { UserAvatarMenu } from '../Auth/UserAvatarMenu';

interface SharedHeaderProps {
  activeService: ActiveService;
  onNavigateService: (service: ActiveService) => void;
  currentQuote?: Quotation;
  onNewQuote?: () => void;
  onOpenList?: () => void;
  onOpenPreview?: () => void;
  onOpenShareModal?: () => void;
  onOpenHelp: () => void;
  isListening: boolean;
  onToggleListening: () => void;
  aiLoading: boolean;
  onToggleMobileSidebar: () => void;
  user: FirebaseUser | null;
  onOpenAuthModal: () => void;
}

export const SERVICES_LIST = [
  { id: 'quotation', title: 'Quotation Studio', icon: FileText, color: 'text-indigo-600', badge: 'Active' },
  { id: 'boq', title: 'BOQ Studio', icon: Layers, color: 'text-amber-600', badge: 'Active' },
  { id: 'inventory', title: 'Inventory Manager', icon: Boxes, color: 'text-emerald-600', badge: 'Active' },
  { id: 'invoice', title: 'Invoice Generator', icon: Receipt, color: 'text-blue-600', badge: 'Active' },
  { id: 'report', title: 'Report Builder', icon: BarChart3, color: 'text-purple-600', badge: 'Active' },
] as const;

export const SharedHeader: React.FC<SharedHeaderProps> = ({
  activeService,
  onNavigateService,
  currentQuote,
  onNewQuote,
  onOpenList,
  onOpenPreview,
  onOpenShareModal,
  onOpenHelp,
  isListening,
  onToggleListening,
  aiLoading,
  onToggleMobileSidebar,
  user,
  onOpenAuthModal,
}) => {
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeServiceObj = SERVICES_LIST.find((s) => s.id === activeService);

  return (
    <header className="h-16 sm:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 lg:px-10 shrink-0 z-30 sticky top-0 shadow-xs">
      
      {/* Left Branding & Service Switcher */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Mobile Voice Sidebar Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
          title="Toggle Gemini Voice Assistant"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Home / Startup Hub Button */}
        <button
          onClick={() => onNavigateService('hub')}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-2 transition-all shadow-sm cursor-pointer"
          title="Return to Startup Service Hub"
        >
          <Home className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-extrabold uppercase tracking-widest hidden sm:inline">Service Hub</span>
        </button>

        <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

        {/* Active Service Dropdown Switcher */}
        {activeService !== 'hub' && (
          <div className="relative" ref={serviceDropdownRef}>
            <button
              onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 transition-colors cursor-pointer"
            >
              {activeServiceObj ? (
                <>
                  <activeServiceObj.icon className={`w-4 h-4 ${activeServiceObj.color}`} />
                  <span className="text-xs font-extrabold tracking-tight uppercase">{activeServiceObj.title}</span>
                </>
              ) : (
                <span className="text-xs font-bold uppercase">Select Service</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isServiceDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 animate-fadeIn">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Switch Active Service
                </div>
                {SERVICES_LIST.map((srv) => {
                  const Icon = srv.icon;
                  const isCurrent = srv.id === activeService;
                  return (
                    <button
                      key={srv.id}
                      onClick={() => {
                        onNavigateService(srv.id);
                        setIsServiceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold transition-colors ${
                        isCurrent ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${srv.color}`} />
                        <span>{srv.title}</span>
                      </div>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        {srv.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Right Actions & Gemini Voice Mic Button */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        
        {/* Active Reference Number (if quotation) */}
        {activeService === 'quotation' && currentQuote && (
          <div className="text-right hidden xl:block mr-2">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold">Active Quote</p>
            <p className="font-mono text-xs font-bold text-slate-800">{currentQuote.quoteNumber}</p>
          </div>
        )}

        {/* Gemini Live Voice Dictate Button */}
        <button
          onClick={onToggleListening}
          disabled={aiLoading}
          id="mic-toggle-btn"
          className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30 shadow-md'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-600/20'
          }`}
          title="Click to speak command or dictate details"
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
          <span className="hidden sm:inline">
            {isListening ? 'Gemini Listening...' : 'Gemini Voice'}
          </span>
        </button>

        {/* Shared Sharing Facility Shortcut */}
        {onOpenShareModal && (
          <button
            onClick={onOpenShareModal}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold uppercase tracking-wider transition-colors border border-slate-200 cursor-pointer"
            title="Shared Sharing Facility"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Share</span>
          </button>
        )}



        {/* Help Guide Modal Trigger */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200 cursor-pointer"
          title="Voice Command & Shortcuts Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Firebase Optional User Auth Avatar Menu */}
        <UserAvatarMenu user={user} onOpenAuthModal={onOpenAuthModal} />
      </div>
    </header>
  );
};
