import React, { useState } from 'react';
import { 
  Plus, Trash2, Calendar, Building, User, Mail, MapPin, FileText,
  Upload, Image, Phone, ChevronDown, ChevronUp, Settings, Send, AlertTriangle, Ruler
} from 'lucide-react';
import { YellowTapeIcon } from './SharedFacility';
import { Quotation, QuoteStatus, CurrencyCode, LineItem, CompanyProfile } from '../types';
import { calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal, formatCurrency, cleanDuplicateWords, getCurrencySymbol, formatFigureOnly, calculateSetupChargeAmount, calculateServiceChargeAmount } from '../utils/quoteUtils';

interface QuoteEditorProps {
  quote: Quotation;
  onUpdateQuote: (updated: Quotation) => void;
  companyProfile: CompanyProfile;
  onUpdateCompanyProfile: (profile: CompanyProfile) => void;
  onDeleteQuote?: (id: string) => void;
  onSendQuote?: () => void;
  showValidationAlert?: boolean;
  missingRequiredFields?: string[];
  onDismissValidationAlert?: () => void;
  onOpenMeasurement?: () => void;
}

export const QuoteEditor: React.FC<QuoteEditorProps> = ({ 
  quote, 
  onUpdateQuote, 
  companyProfile, 
  onUpdateCompanyProfile,
  onDeleteQuote,
  onSendQuote,
  showValidationAlert = false,
  missingRequiredFields = [],
  onDismissValidationAlert,
  onOpenMeasurement
}) => {
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Automatically expand Company Details settings and scroll missing required field into view
  React.useEffect(() => {
    if (showValidationAlert) {
      setIsSettingsExpanded(true);
      const timer = setTimeout(() => {
        let targetEl: HTMLElement | null = null;
        if (!companyProfile.phone || !companyProfile.phone.trim()) {
          targetEl = document.getElementById('field-company-phone');
        } else if (!companyProfile.signatoryName || !companyProfile.signatoryName.trim()) {
          targetEl = document.getElementById('field-signatory-name');
        } else if (!companyProfile.whatsapp || !companyProfile.whatsapp.trim()) {
          targetEl = document.getElementById('field-company-whatsapp');
        }

        if (!targetEl) {
          targetEl = document.getElementById('validation-alert-banner');
        }

        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [showValidationAlert]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateCompanyProfile({
          ...companyProfile,
          logo: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleProfileFieldChange = (field: keyof CompanyProfile, value: string) => {
    onUpdateCompanyProfile({
      ...companyProfile,
      [field]: value
    });
  };

  const handleFieldChange = (field: keyof Quotation, value: any) => {
    const cleanedValue = typeof value === 'string' ? cleanDuplicateWords(value) : value;
    if (field === 'issueDate' && typeof value === 'string' && value) {
      const issueParts = value.split('-').map(Number);
      if (issueParts.length === 3 && !issueParts.some(isNaN)) {
        const issueD = new Date(issueParts[0], issueParts[1] - 1, issueParts[2]);
        const validD = new Date(issueD.getTime() + 7 * 24 * 60 * 60 * 1000);
        const yyyy = validD.getFullYear();
        const mm = String(validD.getMonth() + 1).padStart(2, '0');
        const dd = String(validD.getDate()).padStart(2, '0');
        const validUntilStr = `${yyyy}-${mm}-${dd}`;
        onUpdateQuote({
          ...quote,
          issueDate: value,
          validUntil: validUntilStr,
          updatedAt: new Date().toISOString(),
        });
        return;
      }
    }
    onUpdateQuote({
      ...quote,
      [field]: cleanedValue,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const cleanedValue = field === 'description' && typeof value === 'string' ? cleanDuplicateWords(value) : value;
    const newItems = [...quote.items];
    newItems[index] = {
      ...newItems[index],
      [field]: cleanedValue,
    };
    onUpdateQuote({
      ...quote,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      description: 'New service or product item',
      quantity: 1,
      unitPrice: 100.00,
    };
    onUpdateQuote({
      ...quote,
      items: [...quote.items, newItem],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = (quote.items || []).filter((_, i) => i !== index);
    onUpdateQuote({
      ...quote,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const subtotal = calculateSubtotal(quote);
  const setupChargeAmount = calculateSetupChargeAmount(quote);
  const serviceChargeAmount = calculateServiceChargeAmount(quote);
  const discountAmount = calculateDiscountAmount(quote);
  const taxAmount = calculateTaxAmount(quote);
  const grandTotal = calculateGrandTotal(quote);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 pb-12 animate-fadeIn">
      


      {/* Validation Alert Banner */}
      {showValidationAlert && (
        <div id="validation-alert-banner" className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex items-start justify-between shadow-md animate-bounce-once">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-rose-900">Required Company Information Missing</h4>
              <p className="text-xs font-medium text-rose-700 mt-0.5">
                Please fill in the required field(s) before previewing or sending: <strong className="font-black text-rose-950 underline">{missingRequiredFields.join(', ')}</strong>.
              </p>
            </div>
          </div>
          {onDismissValidationAlert && (
            <button
              type="button"
              onClick={onDismissValidationAlert}
              className="text-rose-400 hover:text-rose-700 text-xs font-bold px-2 py-1 rounded hover:bg-rose-100 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Company Details Configuration Panel */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
          className="w-full flex items-center justify-between p-5 bg-slate-50 border-b border-slate-100 hover:bg-slate-100/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
              <Building className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-xs sm:text-sm text-slate-850">My Company Brand & Details</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Customize issuing company details, logo, and signatory name</p>
            </div>
          </div>
          <div className="text-slate-400">
            {isSettingsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isSettingsExpanded && (
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 animate-slideDown">
            {/* Logo Drag and Drop (4 cols) */}
            <div className="md:col-span-4 flex flex-col space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-600 font-extrabold">Company Logo</label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all min-h-[140px] cursor-pointer ${
                  isDragActive 
                    ? 'border-indigo-500 bg-indigo-50/30' 
                    : companyProfile.logo 
                      ? 'border-slate-200 bg-slate-50' 
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                
                {companyProfile.logo ? (
                  <div className="space-y-3 w-full flex flex-col items-center justify-center">
                    <img 
                      src={companyProfile.logo} 
                      alt="Company Logo Preview" 
                      className="max-h-20 max-w-full object-contain rounded-md"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onUpdateCompanyProfile({ ...companyProfile, logo: '' });
                      }}
                      className="px-2 py-1 text-[9px] bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200 font-semibold transition-colors"
                    >
                      Remove Logo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pointer-events-none">
                    <div className="mx-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-700">Drag & drop logo here</p>
                    <p className="text-[9px] text-slate-400">or click to browse image</p>
                  </div>
                )}
              </div>
              <p className="text-[9px] text-slate-400 italic">This logo will also render as a transparent background watermark.</p>
            </div>

            {/* Issuing Company Profile (8 cols) */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-600 font-extrabold block">Company Name</label>
                <input
                  type="text"
                  value={companyProfile.name}
                  onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-600 font-extrabold block">Slogan / Industry Category</label>
                <input
                  type="text"
                  value={companyProfile.subtitle}
                  onChange={(e) => handleProfileFieldChange('subtitle', e.target.value)}
                  placeholder="e.g. Cloud Security Consultancy"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-600 font-extrabold block">Company Email</label>
                <input
                  type="email"
                  value={companyProfile.email}
                  onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                  placeholder="e.g. billing@acme.com"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-700 font-extrabold flex items-center justify-between">
                  <span>Company Phone <span className="text-rose-500 font-bold">*</span></span>
                  {(!companyProfile.phone || !companyProfile.phone.trim()) && (
                    <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">Required</span>
                  )}
                </label>
                <input
                  id="field-company-phone"
                  type="text"
                  value={companyProfile.phone}
                  onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                  onFocus={() => onDismissValidationAlert?.()}
                  placeholder="your phone number"
                  className={`w-full bg-white border rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 ${
                    (!companyProfile.phone || !companyProfile.phone.trim()) && showValidationAlert
                      ? 'border-rose-400 focus:ring-rose-500 ring-2 ring-rose-200'
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-600 font-extrabold block">Company Address</label>
                <textarea
                  value={companyProfile.address}
                  onChange={(e) => handleProfileFieldChange('address', e.target.value)}
                  onFocus={() => onDismissValidationAlert?.()}
                  placeholder="e.g. 100 Technology Dr, Suite 500&#10;San Francisco, CA 94107"
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans"
                />
              </div>

              {/* Authorized Signatory Fields */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-indigo-700 font-extrabold flex items-center justify-between">
                  <span>Authorized Signatory Name <span className="text-rose-500 font-bold">*</span></span>
                  {(!companyProfile.signatoryName || !companyProfile.signatoryName.trim()) && (
                    <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">Required</span>
                  )}
                </label>
                <input
                  id="field-signatory-name"
                  type="text"
                  value={companyProfile.signatoryName}
                  onChange={(e) => handleProfileFieldChange('signatoryName', e.target.value)}
                  onFocus={() => onDismissValidationAlert?.()}
                  placeholder="your name"
                  className={`w-full bg-white border rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ${
                    (!companyProfile.signatoryName || !companyProfile.signatoryName.trim()) && showValidationAlert
                      ? 'border-rose-400 focus:ring-rose-500 ring-2 ring-rose-200'
                      : 'border-indigo-200 focus:ring-indigo-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-indigo-600 font-extrabold block">Authorized Signatory Title</label>
                <input
                  type="text"
                  value={companyProfile.signatoryTitle}
                  onChange={(e) => handleProfileFieldChange('signatoryTitle', e.target.value)}
                  onFocus={() => onDismissValidationAlert?.()}
                  placeholder="e.g. Managing Director"
                  className="w-full bg-white border border-indigo-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-emerald-700 font-extrabold flex items-center justify-between">
                  <span>Company WhatsApp Number <span className="text-rose-500 font-bold">*</span></span>
                  {(!companyProfile.whatsapp || !companyProfile.whatsapp.trim()) && (
                    <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">Required</span>
                  )}
                </label>
                <input
                  id="field-company-whatsapp"
                  type="text"
                  value={companyProfile.whatsapp}
                  onChange={(e) => handleProfileFieldChange('whatsapp', e.target.value)}
                  onFocus={() => onDismissValidationAlert?.()}
                  placeholder="your WhatsApp number"
                  className={`w-full bg-white border rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ${
                    (!companyProfile.whatsapp || !companyProfile.whatsapp.trim()) && showValidationAlert
                      ? 'border-rose-400 focus:ring-rose-500 ring-2 ring-rose-200'
                      : 'border-emerald-200 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-600 font-extrabold block">Company Country</label>
                <input
                  type="text"
                  value={companyProfile.country}
                  onChange={(e) => handleProfileFieldChange('country', e.target.value)}
                  placeholder="e.g. United States, United Kingdom"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Quotation Sheet Card */}
      <div className="bg-white shadow-sm border border-slate-200 flex flex-col rounded-lg overflow-hidden">
        
        {/* Quote Top Bar / Header metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 p-8 border-b border-slate-200 bg-slate-50/50 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Bill To (Client)</p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={quote.clientCompany}
                  onChange={(e) => handleFieldChange('clientCompany', e.target.value)}
                  placeholder="Company Name (e.g. Summit Architecture LLC)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={quote.clientName}
                    onChange={(e) => handleFieldChange('clientName', e.target.value)}
                    placeholder="Contact Name"
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="email"
                    value={quote.clientEmail}
                    onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
                    placeholder="Email Address"
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <textarea
                  value={quote.clientAddress}
                  onChange={(e) => handleFieldChange('clientAddress', e.target.value)}
                  placeholder="Billing Address (Street, City, Zip)"
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 text-left md:text-right">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Quote Metadata</p>
              
              <div className="flex flex-wrap md:justify-end gap-3 mb-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Status</label>
                  <select
                    value={quote.status}
                    onChange={(e) => handleFieldChange('status', e.target.value as QuoteStatus)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Currency</label>
                  <select
                    value={quote.currency}
                    onChange={(e) => handleFieldChange('currency', e.target.value as CurrencyCode)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Quote Number</span>
                  <input
                    type="text"
                    value={quote.quoteNumber}
                    onChange={(e) => handleFieldChange('quoteNumber', e.target.value)}
                    className="mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-medium text-slate-800 text-left md:text-right w-full"
                  />
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Issue Date</span>
                  <input
                    type="date"
                    value={quote.issueDate}
                    onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                    className="mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 text-left md:text-right w-full"
                  />
                </div>
              </div>

              <div className="mt-2 text-xs">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Valid Until</span>
                <input
                  type="date"
                  value={quote.validUntil}
                  onChange={(e) => handleFieldChange('validUntil', e.target.value)}
                  className="mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 w-full sm:w-48 ml-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[650px]">
            <div className="grid grid-cols-[minmax(220px,2fr)_80px_120px_140px] gap-4 items-center bg-slate-50 border-b border-slate-200 py-3 px-4 sm:px-8 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <div>Description</div>
              <div className="text-center">Qty</div>
              <div className="text-right flex flex-col items-end">
                <span>Rate</span>
                <span className="text-[9px] text-slate-500 font-bold tracking-normal">
                  ({getCurrencySymbol(quote.currency)})
                </span>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex items-center justify-end gap-2 w-full">
                  <span>Amount</span>
                  <button
                    onClick={handleAddItem}
                    className="p-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                    title="Add Line Item"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[9px] text-slate-500 font-bold tracking-normal">
                  ({getCurrencySymbol(quote.currency)})
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {(!quote.items || quote.items.length === 0) ? (
                <div className="py-10 px-4 text-center text-slate-400 text-xs italic bg-slate-50/50 flex flex-col items-center justify-center gap-2.5">
                  <p className="font-medium text-slate-500">No line items on this quotation.</p>
                  <button
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Item</span>
                  </button>
                </div>
              ) : (
                quote.items.map((item, index) => {
                  const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                  return (
                    <div key={item.id} className="grid grid-cols-[minmax(220px,2fr)_80px_120px_140px] gap-4 py-4 px-4 sm:px-8 items-center text-sm hover:bg-slate-50/80 transition-colors group">
                      <div>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Service or product description..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="text-center">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="text-right flex items-center justify-end gap-2">
                        <span className="font-bold font-mono text-slate-800 text-xs sm:text-sm">
                          {formatFigureOnly(itemTotal)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="p-8 border-t-2 border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <label className="font-bold uppercase tracking-wider text-slate-400">Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={quote.discountPercentage}
                onChange={(e) => handleFieldChange('discountPercentage', parseFloat(e.target.value) || 0)}
                className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-right font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="font-bold uppercase tracking-wider text-slate-400">Tax Rate %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={quote.taxRate}
                onChange={(e) => handleFieldChange('taxRate', parseFloat(e.target.value) || 0)}
                className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-right font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Setup Charge % */}
            <div className="flex items-center space-x-2">
              <label className="font-bold uppercase tracking-wider text-slate-400">Setup Charge %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={quote.setupCharge || ''}
                placeholder="0"
                onChange={(e) => handleFieldChange('setupCharge', parseFloat(e.target.value) || 0)}
                className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-right font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Service Charge % */}
            <div className="flex items-center space-x-2">
              <label className="font-bold uppercase tracking-wider text-slate-400">Service Charge %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={quote.serviceCharge || ''}
                placeholder="0"
                onChange={(e) => handleFieldChange('serviceCharge', parseFloat(e.target.value) || 0)}
                className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-right font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="w-full md:w-80 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">Subtotal</span>
              <span className="font-mono font-medium text-slate-800">{formatCurrency(subtotal, quote.currency)}</span>
            </div>
            {quote.setupCharge !== undefined && quote.setupCharge > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 uppercase tracking-wider font-semibold">Setup Charge ({quote.setupCharge}%)</span>
                <span className="font-mono font-medium text-slate-800">+{formatCurrency(setupChargeAmount, quote.currency)}</span>
              </div>
            )}
            {quote.serviceCharge !== undefined && quote.serviceCharge > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 uppercase tracking-wider font-semibold">Service Charge ({quote.serviceCharge}%)</span>
                <span className="font-mono font-medium text-slate-800">+{formatCurrency(serviceChargeAmount, quote.currency)}</span>
              </div>
            )}
            {quote.discountPercentage > 0 && (
              <div className="flex justify-between text-xs text-indigo-600">
                <span className="uppercase tracking-wider font-semibold">Discount ({quote.discountPercentage}%)</span>
                <span className="font-mono">-{formatCurrency(discountAmount, quote.currency)}</span>
              </div>
            )}
            {quote.taxRate > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 uppercase tracking-wider font-semibold">Tax ({quote.taxRate}%)</span>
                <span className="font-mono font-medium text-slate-800">+{formatCurrency(taxAmount, quote.currency)}</span>
              </div>
            )}
            <div className="h-px bg-slate-200 my-2"></div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800">Total Amount</span>
              <span className="text-2xl font-bold text-indigo-600 font-mono italic">{formatCurrency(grandTotal, quote.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Terms & Conditions</label>
        <textarea
          value={quote.terms}
          onChange={(e) => handleFieldChange('terms', e.target.value)}
          rows={3}
          placeholder="Payment due within 30 days..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans font-medium"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 mt-6">
        {onSendQuote && (
          <button
            type="button"
            onClick={onSendQuote}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send / Preview Quotation</span>
          </button>
        )}

        <div>
          {onDeleteQuote && (
            showDeleteConfirm ? (
              <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 p-2 rounded-lg animate-fadeIn">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Delete quotation {quote.quoteNumber}?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDeleteQuote(quote.id);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-rose-200 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete This Quotation</span>
              </button>
            )
          )}
        </div>
      </div>

    </div>
  );
};
