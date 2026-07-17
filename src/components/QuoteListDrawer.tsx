import React, { useState } from 'react';
import { X, Plus, Search, Trash2, Copy, FileText, CheckCircle, Clock, ArrowRight, Calendar } from 'lucide-react';
import { Quotation, QuoteStatus } from '../types';
import { formatCurrency, calculateGrandTotal } from '../utils/quoteUtils';

interface QuoteListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: Quotation[];
  currentQuoteId: string;
  onSelectQuote: (id: string) => void;
  onNewQuote: () => void;
  onDeleteQuote: (id: string) => void;
  onDuplicateQuote: (quote: Quotation) => void;
}

export const QuoteListDrawer: React.FC<QuoteListDrawerProps> = ({
  isOpen,
  onClose,
  quotes,
  currentQuoteId,
  onSelectQuote,
  onNewQuote,
  onDeleteQuote,
  onDuplicateQuote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  if (!isOpen) return null;

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientCompany.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: QuoteStatus) => {
    switch (status) {
      case 'Accepted':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Sent':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Draft':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Expired':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-lg text-white">Saved Quotations</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {quotes.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by quote #, client, company..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['All', 'Draft', 'Sent', 'Accepted', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* List of quotes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <FileText className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm">No quotations found.</p>
            </div>
          ) : (
            filteredQuotes.map((q) => {
              const isSelected = q.id === currentQuoteId;
              const grandTotal = calculateGrandTotal(q);

              return (
                <div
                  key={q.id}
                  onClick={() => {
                    onSelectQuote(q.id);
                    onClose();
                  }}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-mono font-semibold text-indigo-400">
                        {q.quoteNumber}
                      </span>
                      <h3 className="font-medium text-slate-100 text-sm mt-0.5">
                        {q.clientCompany || q.clientName || 'Unnamed Client'}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusBadgeClass(q.status)}`}>
                      {q.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{q.issueDate}</span>
                    </div>
                    <span className="font-semibold text-emerald-400 font-mono">
                      {formatCurrency(grandTotal, q.currency)}
                    </span>
                  </div>

                  {/* Quick Action Buttons on hover */}
                  <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-700 shadow-md">
                    <button
                      title="Duplicate Quote"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateQuote(q);
                      }}
                      className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Delete Quote"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete ${q.quoteNumber}?`)) {
                          onDeleteQuote(q.id);
                        }
                      }}
                      className="p-1.5 rounded text-rose-400 hover:text-white hover:bg-rose-900 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer New Quote Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={() => {
              onNewQuote();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quotation</span>
          </button>
        </div>

      </div>
    </div>
  );
};
