export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'NGN';

export type ActiveService = 'hub' | 'quotation' | 'boq' | 'inventory' | 'invoice' | 'report';

export interface ServiceMeta {
  id: ActiveService;
  title: string;
  shortTitle: string;
  description: string;
  iconName: string;
  badge: string;
  badgeColor: string;
  color: string;
  accentBg: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientAddress: string;
  issueDate: string;
  validUntil: string;
  currency: CurrencyCode;
  items: LineItem[];
  taxRate: number; // percentage e.g. 10 for 10%
  discountPercentage: number; // percentage e.g. 5 for 5%
  setupCharge?: number;
  serviceCharge?: number;
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
}

// BOQ (Bill of Quantities) Types
export interface BoqItem {
  id: string;
  itemNo: string;
  section: 'Substructure' | 'Superstructure' | 'Finishes' | 'Services' | 'General';
  description: string;
  unit: string;
  quantity: number;
  rate: number;
}

export interface BoqDocument {
  id: string;
  boqNumber: string;
  projectName: string;
  clientName: string;
  location: string;
  date: string;
  currency: CurrencyCode;
  items: BoqItem[];
  contingencyRate: number;
  notes: string;
}

// Inventory Management Types
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  reorderLevel: number;
  supplier: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

// Invoice Generator Types
export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Draft';

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  items: LineItem[];
  taxRate: number;
  discountPercentage: number;
  status: InvoiceStatus;
  notes: string;
}

export interface VoiceLogEntry {
  id: string;
  timestamp: string;
  transcript: string;
  explanation: string;
  type: 'success' | 'error';
}

export interface CompanyProfile {
  name: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  logo: string; // Base64 data URL
  signatoryName: string;
  signatoryTitle: string;
  whatsapp: string;
  country: string;
}


