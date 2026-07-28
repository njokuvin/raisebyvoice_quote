import React, { useState } from 'react';
import { Receipt, Plus, Share2, CheckCircle2, Clock, AlertCircle, Trash2, Printer, FileText } from 'lucide-react';
import { InvoiceRecord, LineItem, CompanyProfile, CurrencyCode } from '../../types';

interface InvoiceServiceProps {
  companyProfile: CompanyProfile;
  onOpenShareModal: (title: string, refNum: string, summaryText: string) => void;
}

const sampleInvoices: InvoiceRecord[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'INV-2026-001',
    clientName: 'Ali Bello',
    clientCompany: 'Cyberdyne Systems Ltd',
    clientEmail: 'ali.bello@cyberdyne.io',
    issueDate: '2026-07-01',
    dueDate: '2026-07-15',
    currency: 'NGN',
    items: [
      { id: 'item-1', description: 'Enterprise Software License & Deployment', quantity: 1, unitPrice: 450000 },
      { id: 'item-2', description: 'Onsite Systems Integration & Support', quantity: 10, unitPrice: 15000 },
    ],
    taxRate: 7.5,
    discountPercentage: 5,
    status: 'Paid',
    notes: 'Thank you for your business!',
  },
  {
    id: 'inv-102',
    invoiceNumber: 'INV-2026-002',
    clientName: 'Chidi Okonkwo',
    clientCompany: 'AeroDynamics Tech',
    clientEmail: 'chidi@aerodynamics.com',
    issueDate: '2026-07-10',
    dueDate: '2026-07-25',
    currency: 'USD',
    items: [
      { id: 'item-3', description: 'Cloud Infrastructure Setup', quantity: 1, unitPrice: 1200 },
    ],
    taxRate: 0,
    discountPercentage: 0,
    status: 'Pending',
    notes: 'Payment due within 15 days of invoice date.',
  },
];

export const InvoiceService: React.FC<InvoiceServiceProps> = ({ companyProfile, onOpenShareModal }) => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(sampleInvoices);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(sampleInvoices[0].id);

  const activeInvoice = invoices.find((i) => i.id === activeInvoiceId) || invoices[0];

  const handleUpdateInvoice = (updated: InvoiceRecord) => {
    setInvoices(invoices.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleCreateNewInvoice = () => {
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const newInv: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName: 'New Client',
      clientCompany: '',
      clientEmail: '',
      issueDate: today,
      dueDate: due,
      currency: 'NGN',
      items: [{ id: 'i-1', description: 'Consulting & Services', quantity: 1, unitPrice: 50000 }],
      taxRate: 7.5,
      discountPercentage: 0,
      status: 'Pending',
      notes: 'Payment within 14 days.',
    };
    setInvoices([newInv, ...invoices]);
    setActiveInvoiceId(newInv.id);
  };

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `i-${Date.now()}`,
      description: 'Service or product',
      quantity: 1,
      unitPrice: 10000,
    };
    handleUpdateInvoice({
      ...activeInvoice,
      items: [...activeInvoice.items, newItem],
    });
  };

  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    const newItems = [...activeInvoice.items];
    newItems[index] = { ...newItems[index], [field]: val };
    handleUpdateInvoice({ ...activeInvoice, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    handleUpdateInvoice({
      ...activeInvoice,
      items: activeInvoice.items.filter((_, i) => i !== index),
    });
  };

  // Calculations
  const subtotal = activeInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = (subtotal * activeInvoice.discountPercentage) / 100;
  const taxable = subtotal - discountAmount;
  const taxAmount = (taxable * activeInvoice.taxRate) / 100;
  const grandTotal = taxable + taxAmount;

  const handleShareClick = () => {
    const summary = `INVOICE ${activeInvoice.invoiceNumber}\nClient: ${activeInvoice.clientName} (${activeInvoice.clientCompany || 'N/A'})\nStatus: ${activeInvoice.status}\nIssue Date: ${activeInvoice.issueDate} | Due Date: ${activeInvoice.dueDate}\nTotal Payable: ${activeInvoice.currency} ${grandTotal.toLocaleString()}`;
    onOpenShareModal('Client Invoice', activeInvoice.invoiceNumber, summary);
  };

  return (
    <div className="flex-1 w-full p-4 sm:p-6 lg:p-10 bg-slate-50 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Invoice Studio Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Invoice Generator</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Tax Invoices & Billing
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Active Invoice: {activeInvoice.invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShareClick}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>Share Invoice</span>
            </button>
            <button
              onClick={handleCreateNewInvoice}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>

        {/* Invoices List Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => setActiveInvoiceId(inv.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-all cursor-pointer ${
                inv.id === activeInvoiceId
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{inv.invoiceNumber}</span>
              <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded ${
                inv.status === 'Paid' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {inv.status}
              </span>
            </button>
          ))}
        </div>

        {/* Invoice Card Container */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Top Invoice Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Client Information</span>
              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold">Client Name</label>
                <input
                  type="text"
                  value={activeInvoice.clientName}
                  onChange={(e) => handleUpdateInvoice({ ...activeInvoice, clientName: e.target.value })}
                  className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold">Company</label>
                  <input
                    type="text"
                    value={activeInvoice.clientCompany}
                    onChange={(e) => handleUpdateInvoice({ ...activeInvoice, clientCompany: e.target.value })}
                    className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold">Client Email</label>
                  <input
                    type="email"
                    value={activeInvoice.clientEmail}
                    onChange={(e) => handleUpdateInvoice({ ...activeInvoice, clientEmail: e.target.value })}
                    className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Invoice Settings & Status</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold">Issue Date</label>
                  <input
                    type="date"
                    value={activeInvoice.issueDate}
                    onChange={(e) => handleUpdateInvoice({ ...activeInvoice, issueDate: e.target.value })}
                    className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold">Due Date</label>
                  <input
                    type="date"
                    value={activeInvoice.dueDate}
                    onChange={(e) => handleUpdateInvoice({ ...activeInvoice, dueDate: e.target.value })}
                    className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold">Payment Status</label>
                <select
                  value={activeInvoice.status}
                  onChange={(e) => handleUpdateInvoice({ ...activeInvoice, status: e.target.value as any })}
                  className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-extrabold text-slate-800 focus:outline-none"
                >
                  <option value="Paid">Paid (Settled)</option>
                  <option value="Pending">Pending Payment</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Line Items & Services</span>
              <button
                onClick={handleAddItem}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {activeInvoice.items.map((item, index) => {
                const total = item.quantity * item.unitPrice;
                return (
                  <div key={item.id} className="p-3 bg-white grid grid-cols-1 sm:grid-cols-[2fr_80px_120px_120px_32px] gap-3 items-center text-xs">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-mono"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-right font-mono"
                    />
                    <div className="text-right font-mono font-bold text-slate-900">
                      {activeInvoice.currency} {total.toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals & Notes */}
          <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="w-full md:w-1/2 space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">Payment Terms & Notes</label>
              <textarea
                value={activeInvoice.notes}
                onChange={(e) => handleUpdateInvoice({ ...activeInvoice, notes: e.target.value })}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none"
              />
            </div>

            <div className="w-full md:w-80 space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold">{activeInvoice.currency} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 items-center">
                <span>Tax Rate (%):</span>
                <input
                  type="number"
                  value={activeInvoice.taxRate}
                  onChange={(e) => handleUpdateInvoice({ ...activeInvoice, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-16 text-right border border-slate-200 rounded px-1 py-0.5 bg-white text-xs"
                />
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax Amount:</span>
                <span className="font-bold">{activeInvoice.currency} {taxAmount.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-blue-600">{activeInvoice.currency} {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
