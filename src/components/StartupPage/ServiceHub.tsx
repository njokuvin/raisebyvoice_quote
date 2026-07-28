import React, { useState } from 'react';
import { 
  FileText, Layers, Boxes, Receipt, BarChart3, ArrowRight, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { ActiveService, Quotation } from '../../types';

interface ServiceHubProps {
  onSelectService: (service: ActiveService) => void;
  onStartVoice: () => void;
  isListening: boolean;
  currentQuote: Quotation;
}

export const SERVICES_CONFIG = [
  {
    id: 'quotation' as ActiveService,
    title: 'Quotation Creator',
    shortTitle: 'Quotation',
    category: 'Sales & Estimates',
    description: 'Create, edit, and export professional client quotations using natural voice speech or manual editing in Hausa & English.',
    icon: FileText,
    badge: 'Fully Integrated',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    color: 'from-indigo-500 to-indigo-700',
    iconBg: 'bg-indigo-600 text-white',
    borderHover: 'hover:border-indigo-500 hover:shadow-indigo-500/10',
    highlights: [
      'Voice item addition & quantity calculation',
      'Dual currency (NGN, USD, EUR, GBP, CAD)',
      'Customized company profiles & signatures',
      'High-resolution PDF export & WhatsApp sharing',
    ],
    actionText: 'Launch Quotation Studio',
  },
  {
    id: 'boq' as ActiveService,
    title: 'BOQ (Bill of Quantities)',
    shortTitle: 'BOQ Studio',
    category: 'Engineering & Construction',
    description: 'Structure comprehensive bills of quantities across Substructure, Superstructure, Finishes, and Services trades.',
    icon: Layers,
    badge: 'Active Studio',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    color: 'from-amber-500 to-amber-700',
    iconBg: 'bg-amber-600 text-white',
    borderHover: 'hover:border-amber-500 hover:shadow-amber-500/10',
    highlights: [
      'Trade-based section organization',
      'Unit rate & quantity sum formulas',
      'Contingency & general preliminaries',
      'Integrated Gemini Live voice line additions',
    ],
    actionText: 'Launch BOQ Studio',
  },
  {
    id: 'inventory' as ActiveService,
    title: 'Inventory Management',
    shortTitle: 'Inventory',
    category: 'Stock & Warehouse',
    description: 'Track stock balances, unit costs, selling prices, and reorder thresholds with real-time stock alert indicators.',
    icon: Boxes,
    badge: 'Active Studio',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    color: 'from-emerald-500 to-emerald-700',
    iconBg: 'bg-emerald-600 text-white',
    borderHover: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
    highlights: [
      'SKU & Category classification',
      'Low Stock & Out of Stock indicators',
      'Voice-guided stock level adjustments',
      'Inventory valuation summary',
    ],
    actionText: 'Manage Inventory',
  },
  {
    id: 'invoice' as ActiveService,
    title: 'Invoice Generator',
    shortTitle: 'Invoice',
    category: 'Billing & Payments',
    description: 'Generate tax invoices, track payment status (Paid, Pending, Overdue), and issue receipts for clients.',
    icon: Receipt,
    badge: 'Active Studio',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    color: 'from-blue-500 to-blue-700',
    iconBg: 'bg-blue-600 text-white',
    borderHover: 'hover:border-blue-500 hover:shadow-blue-500/10',
    highlights: [
      'Tax & Discount breakdown calculations',
      'Payment due dates & status flags',
      'Conversion from Quotation to Invoice',
      'Printable payment receipt formatting',
    ],
    actionText: 'Generate Invoice',
  },
  {
    id: 'report' as ActiveService,
    title: 'Report Builder',
    shortTitle: 'Reports',
    category: 'Analytics & Insights',
    description: 'Visualize sales performance, quote conversion rates, revenue trends, and inventory valuation metrics.',
    icon: BarChart3,
    badge: 'Active Studio',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    color: 'from-purple-500 to-purple-700',
    iconBg: 'bg-purple-600 text-white',
    borderHover: 'hover:border-purple-500 hover:shadow-purple-500/10',
    highlights: [
      'Interactive Recharts revenue trends',
      'Quotation vs Invoice status ratios',
      'Category revenue distribution',
      'Voice-queried financial insights',
    ],
    actionText: 'View Financial Reports',
  },
];

export const ServiceHub: React.FC<ServiceHubProps> = ({
  onSelectService,
  onStartVoice,
  isListening,
  currentQuote,
}) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        
        {/* Startup Hero Header */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden shadow-lg border border-slate-800">
          
          {/* Subtle Background Accent Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 space-y-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
              Raisebyvoice
            </h1>
            
            <p className="text-xs sm:text-sm font-medium text-indigo-300 italic">
              (Multilingual AI Voice powered business suite to get things done with the speed of light)
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal pt-1">
              Select any of the services below, tap the microphone icon and speak in your preferred language using keywords add, set, remove or clear to input, update or remove entries.
            </p>
          </div>
        </div>

        {/* 5 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES_CONFIG.map((service) => {
            const Icon = service.icon;
            const isExpanded = !!expandedCards[service.id];

            return (
              <div
                key={service.id}
                className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md group relative overflow-hidden ${service.borderHover}`}
              >
                {/* Collapsed Header Bar */}
                <div 
                  onClick={() => toggleExpand(service.id)}
                  className="flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl ${service.iconBg} flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {service.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {service.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectService(service.id);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(service.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{service.category}</span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${service.badgeBg}`}>
                        {service.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{service.description}</p>

                    <div className="space-y-1.5">
                      {service.highlights.map((feat, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectService(service.id);
                        }}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
                      >
                        <span>{service.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
