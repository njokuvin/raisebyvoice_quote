export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'NGN';

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
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
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

