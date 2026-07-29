import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Download, Share2, Calculator, Building2, Check, FileSpreadsheet, Ruler, Cloud } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { YellowTapeIcon } from '../SharedFacility';
import { BoqDocument, BoqItem, CompanyProfile, CurrencyCode } from '../../types';
import { saveBoqToFirestore, fetchBoqsFromFirestore } from '../../lib/firebase';

interface BoqServiceProps {
  companyProfile: CompanyProfile;
  onOpenShareModal: (title: string, refNum: string, summaryText: string) => void;
  onOpenMeasurement?: () => void;
  user?: FirebaseUser | null;
}

const sampleBoqItems: BoqItem[] = [
  { id: 'b1', itemNo: '1.1', section: 'Substructure', description: 'Excavation for foundation trench including backfilling & soil compaction', unit: 'm³', quantity: 150, rate: 4500 },
  { id: 'b2', itemNo: '1.2', section: 'Substructure', description: 'Reinforced concrete grade 25/20 in foundation footings & columns', unit: 'm³', quantity: 45, rate: 85000 },
  { id: 'b3', itemNo: '2.1', section: 'Superstructure', description: '225mm hollow concrete blockwork in cement mortar 1:4', unit: 'm²', quantity: 320, rate: 12500 },
  { id: 'b4', itemNo: '2.2', section: 'Superstructure', description: 'Structural steel roof trusses with anti-rust priming paint', unit: 'kg', quantity: 1200, rate: 1800 },
  { id: 'b5', itemNo: '3.1', section: 'Finishes', description: '15mm cement-sand screed flooring ready for porcelain tile installation', unit: 'm²', quantity: 280, rate: 6500 },
];

export const BoqService: React.FC<BoqServiceProps> = ({ companyProfile, onOpenShareModal, onOpenMeasurement, user }) => {
  const [boq, setBoq] = useState<BoqDocument>({
    id: 'boq-001',
    boqNumber: 'BOQ-2026-001',
    projectName: 'Commercial Complex Renovation Project',
    clientName: 'Cyberdyne Systems Ltd',
    location: 'Plot 42, Victoria Island, Lagos',
    date: new Date().toISOString().split('T')[0],
    currency: 'NGN',
    items: sampleBoqItems,
    contingencyRate: 5,
    notes: 'All materials must comply with standard civil engineering building codes.',
  });

  // Load BOQ from Firestore if user is logged in
  useEffect(() => {
    if (user?.uid) {
      fetchBoqsFromFirestore(user.uid).then((remoteBoqs) => {
        if (remoteBoqs && remoteBoqs.length > 0) {
          setBoq(remoteBoqs[0]);
        } else {
          saveBoqToFirestore(user.uid, boq);
        }
      }).catch(err => console.error('Error fetching BOQ from Firestore:', err));
    }
  }, [user]);

  // Sync BOQ to Firestore on updates if signed in
  const updateBoqAndSync = (updated: BoqDocument) => {
    setBoq(updated);
    if (user?.uid) {
      saveBoqToFirestore(user.uid, updated);
    }
  };

  const handleAddItem = () => {
    const newIdx = boq.items.length + 1;
    const newItem: BoqItem = {
      id: `b-${Date.now()}`,
      itemNo: `3.${newIdx}`,
      section: 'General',
      description: 'New Bill Item',
      unit: 'm²',
      quantity: 1,
      rate: 1000,
    };
    updateBoqAndSync({ ...boq, items: [...boq.items, newItem] });
  };

  const handleItemChange = (index: number, field: keyof BoqItem, value: any) => {
    const newItems = [...boq.items];
    newItems[index] = { ...newItems[index], [field]: value };
    updateBoqAndSync({ ...boq, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    updateBoqAndSync({ ...boq, items: boq.items.filter((_, i) => i !== index) });
  };

  // Calculations
  const subtotal = boq.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const contingencyAmount = (subtotal * boq.contingencyRate) / 100;
  const grandTotal = subtotal + contingencyAmount;

  const handleShareClick = () => {
    const summary = `Project: ${boq.projectName}\nClient: ${boq.clientName}\nLocation: ${boq.location}\nItems Count: ${boq.items.length}\nSubtotal: ${boq.currency} ${subtotal.toLocaleString()}\nContingency (${boq.contingencyRate}%): ${boq.currency} ${contingencyAmount.toLocaleString()}\nGrand Total: ${boq.currency} ${grandTotal.toLocaleString()}`;
    onOpenShareModal('Bill of Quantities (BOQ)', boq.boqNumber, summary);
  };

  return (
    <div className="flex-1 w-full p-4 sm:p-6 lg:p-10 bg-slate-50 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* BOQ Header Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">BOQ Studio</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Bill of Quantities
                </span>
                {user && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-indigo-600" />
                    Firestore Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Reference: {boq.boqNumber}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* {onOpenMeasurement && (
              <button
                type="button"
                onClick={onOpenMeasurement}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer group"
                title="Launch Raisebyvoice-measurement (AR Tape)"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 p-0.5">
                  <YellowTapeIcon className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col items-start text-left leading-tight">
                  <span className="text-xs font-bold text-slate-900">Raisebyvoice-measurement</span>
                  <span className="text-[10px] font-semibold text-slate-500">take measurement</span>
                </div>
              </button>
            )} */}
            <button
              onClick={handleShareClick}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-600" />
              <span>Share / Export</span>
            </button>
            <button
              onClick={handleAddItem}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bill Item</span>
            </button>
          </div>
        </div>

        {/* Project Details Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400">Project Name</label>
            <input
              type="text"
              value={boq.projectName}
              onChange={(e) => updateBoqAndSync({ ...boq, projectName: e.target.value })}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400">Client / Contractor Name</label>
            <input
              type="text"
              value={boq.clientName}
              onChange={(e) => updateBoqAndSync({ ...boq, clientName: e.target.value })}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400">Site Location</label>
            <input
              type="text"
              value={boq.location}
              onChange={(e) => updateBoqAndSync({ ...boq, location: e.target.value })}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* BOQ Items Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>Bill of Quantities Line Items ({boq.items.length})</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-16">Item #</th>
                  <th className="py-3 px-4 w-32">Section</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 w-20 text-center">Unit</th>
                  <th className="py-3 px-4 w-24 text-center">Qty</th>
                  <th className="py-3 px-4 w-32 text-right">Rate ({boq.currency})</th>
                  <th className="py-3 px-4 w-36 text-right">Amount ({boq.currency})</th>
                  <th className="py-3 px-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {boq.items.map((item, index) => {
                  const amount = item.quantity * item.rate;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.itemNo}</td>
                      <td className="py-3 px-4">
                        <select
                          value={item.section}
                          onChange={(e) => handleItemChange(index, 'section', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-semibold focus:outline-none"
                        >
                          <option value="Substructure">Substructure</option>
                          <option value="Superstructure">Superstructure</option>
                          <option value="Finishes">Finishes</option>
                          <option value="Services">Services</option>
                          <option value="General">General</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-20 text-center font-mono bg-white border border-slate-200 rounded px-1 py-1 focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 text-center font-mono bg-white border border-slate-200 rounded px-1 py-1 focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-28 text-right font-mono bg-white border border-slate-200 rounded px-1 py-1 focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* BOQ Summary Totals */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="w-full md:w-1/2 space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">BOQ Notes & Conditions</label>
              <textarea
                value={boq.notes}
                onChange={(e) => updateBoqAndSync({ ...boq, notes: e.target.value })}
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none"
              />
            </div>

            <div className="w-full md:w-80 space-y-2 bg-white border border-slate-200 rounded-xl p-4 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Measured:</span>
                <span className="font-bold">{boq.currency} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 items-center">
                <span>Contingency (%):</span>
                <input
                  type="number"
                  value={boq.contingencyRate}
                  onChange={(e) => updateBoqAndSync({ ...boq, contingencyRate: parseFloat(e.target.value) || 0 })}
                  className="w-16 text-right border border-slate-200 rounded px-1 py-0.5 bg-slate-50 text-xs"
                />
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Contingency Amount:</span>
                <span className="font-bold">{boq.currency} {contingencyAmount.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total BOQ:</span>
                <span className="text-amber-600">{boq.currency} {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
