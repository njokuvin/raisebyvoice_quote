import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Search, AlertTriangle, CheckCircle2, XCircle, Share2, Edit3, Trash2, Tag, Cloud, CloudCheck } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { InventoryItem, CompanyProfile } from '../../types';
import { 
  saveInventoryToFirestore, 
  fetchInventoryFromFirestore, 
  deleteInventoryFromFirestore 
} from '../../lib/firebase';

interface InventoryServiceProps {
  companyProfile: CompanyProfile;
  onOpenShareModal: (title: string, refNum: string, summaryText: string) => void;
  user?: FirebaseUser | null;
}

const initialInventory: InventoryItem[] = [
  { id: 'inv-1', sku: 'SKU-CONC-001', name: 'Portland Cement 50kg Bag', category: 'Building Materials', quantity: 180, unitCost: 8500, sellingPrice: 9800, reorderLevel: 50, supplier: 'Dangote Cement', status: 'In Stock' },
  { id: 'inv-2', sku: 'SKU-STEL-012', name: '12mm High Yield Steel Rods (12m)', category: 'Metals & Steel', quantity: 24, unitCost: 14500, sellingPrice: 16200, reorderLevel: 30, supplier: 'Prosteel Ltd', status: 'Low Stock' },
  { id: 'inv-3', sku: 'SKU-TILE-045', name: '60x60 Porcelain Floor Tiles (Box)', category: 'Finishes', quantity: 0, unitCost: 11000, sellingPrice: 13500, reorderLevel: 20, supplier: 'Royal Ceramics', status: 'Out of Stock' },
  { id: 'inv-4', sku: 'SKU-ELEC-088', name: '2.5mm Single Core Copper Cable (100m)', category: 'Electrical', quantity: 95, unitCost: 32000, sellingPrice: 37500, reorderLevel: 15, supplier: 'Coleman Cables', status: 'In Stock' },
  { id: 'inv-5', sku: 'SKU-PLUM-022', name: '4-inch PVC Soil Pipe (3m)', category: 'Plumbing', quantity: 60, unitCost: 6200, sellingPrice: 7500, reorderLevel: 25, supplier: 'Tower Plastics', status: 'In Stock' },
];

export const InventoryService: React.FC<InventoryServiceProps> = ({ companyProfile, onOpenShareModal, user }) => {
  const [items, setItems] = useState<InventoryItem[]>(initialInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Load Inventory from Firestore if user is authenticated
  useEffect(() => {
    if (user?.uid) {
      fetchInventoryFromFirestore(user.uid).then((remoteItems) => {
        if (remoteItems && remoteItems.length > 0) {
          setItems(remoteItems);
        } else {
          // Initialize Firestore with default items if user has none yet
          initialInventory.forEach((item) => {
            saveInventoryToFirestore(user.uid, item);
          });
        }
      }).catch(err => console.error('Error fetching inventory from Firestore:', err));
    }
  }, [user]);

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    category: 'General',
    quantity: 10,
    unitCost: 1000,
    sellingPrice: 1200,
    reorderLevel: 5,
    supplier: '',
  });

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateItem = () => {
    if (!newItem.name || !newItem.name.trim()) return;
    const qty = Number(newItem.quantity) || 0;
    const reorder = Number(newItem.reorderLevel) || 5;

    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (qty === 0) status = 'Out of Stock';
    else if (qty <= reorder) status = 'Low Stock';

    const created: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: newItem.sku || `SKU-${Date.now()}`,
      name: newItem.name,
      category: newItem.category || 'General',
      quantity: qty,
      unitCost: Number(newItem.unitCost) || 0,
      sellingPrice: Number(newItem.sellingPrice) || 0,
      reorderLevel: reorder,
      supplier: newItem.supplier || 'Primary Supplier',
      status,
    };

    setItems([created, ...items]);
    if (user?.uid) {
      saveInventoryToFirestore(user.uid, created);
    }

    setIsAddingItem(false);
    setNewItem({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'General',
      quantity: 10,
      unitCost: 1000,
      sellingPrice: 1200,
      reorderLevel: 5,
      supplier: '',
    });
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    if (user?.uid) {
      deleteInventoryFromFirestore(user.uid, id);
    }
  };

  const totalValuation = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const lowStockCount = items.filter((i) => i.status === 'Low Stock').length;
  const outOfStockCount = items.filter((i) => i.status === 'Out of Stock').length;

  const handleShareClick = () => {
    const summary = `Inventory Stock Report (${new Date().toLocaleDateString()})\nTotal SKUs: ${items.length}\nLow Stock Items: ${lowStockCount}\nOut of Stock Items: ${outOfStockCount}\nTotal Inventory Cost Valuation: NGN ${totalValuation.toLocaleString()}`;
    onOpenShareModal('Stock Inventory Summary', 'INV-REPORT-01', summary);
  };

  return (
    <div className="flex-1 w-full p-4 sm:p-6 lg:p-10 bg-slate-50 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Header Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Inventory Manager</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Stock Control
                </span>
                {user && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-indigo-600" />
                    Firestore Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Valuation: NGN {totalValuation.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShareClick}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Export Stock Summary</span>
            </button>
            <button
              onClick={() => setIsAddingItem(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Stock Item</span>
            </button>
          </div>
        </div>

        {/* Stock Status Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Stock Items</p>
              <p className="text-xl font-black text-slate-800 font-mono mt-0.5">{items.length} SKUs</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Low Stock Warning</p>
              <p className="text-xl font-black text-amber-700 font-mono mt-0.5">{lowStockCount} Items</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Out of Stock</p>
              <p className="text-xl font-black text-rose-700 font-mono mt-0.5">{outOfStockCount} Items</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU or item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Item Modal Drawer */}
        {isAddingItem && (
          <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm uppercase text-slate-800">Add New Inventory Stock</h3>
              <button onClick={() => setIsAddingItem(false)} className="text-xs font-bold text-slate-400 hover:text-slate-700">Cancel</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-extrabold text-[10px] text-slate-400 uppercase">SKU Code</label>
                <input
                  type="text"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-extrabold text-[10px] text-slate-400 uppercase">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Electric Drill 850W"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                />
              </div>
              <div>
                <label className="font-extrabold text-[10px] text-slate-400 uppercase">Category</label>
                <input
                  type="text"
                  placeholder="Tools, Electrical, Hardware"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                />
              </div>
              <div>
                <label className="font-extrabold text-[10px] text-slate-400 uppercase">Initial Quantity</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value, 10) || 0 })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-extrabold text-[10px] text-slate-400 uppercase">Unit Cost (NGN)</label>
                <input
                  type="number"
                  value={newItem.unitCost}
                  onChange={(e) => setNewItem({ ...newItem, unitCost: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-extrabold text-[10px] text-slate-400 uppercase">Selling Price (NGN)</label>
                <input
                  type="number"
                  value={newItem.sellingPrice}
                  onChange={(e) => setNewItem({ ...newItem, sellingPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-extrabold text-[10px] text-slate-400 uppercase">Reorder Warning Level</label>
                <input
                  type="number"
                  value={newItem.reorderLevel}
                  onChange={(e) => setNewItem({ ...newItem, reorderLevel: parseInt(e.target.value, 10) || 5 })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-extrabold text-[10px] text-slate-400 uppercase">Supplier</label>
                <input
                  type="text"
                  placeholder="Primary Supplier Name"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleCreateItem}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Save Stock Item
              </button>
            </div>
          </div>
        )}

        {/* Inventory Items Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Qty in Stock</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{item.sku}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">NGN {item.unitCost.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">NGN {item.sellingPrice.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.status === 'In Stock'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Low Stock'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                        title="Delete stock item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
