import { Quotation } from '../types';

export const sampleQuotes: Quotation[] = [
  {
    id: 'quote-1',
    quoteNumber: 'QT-2026-001',
    status: 'Sent',
    clientName: 'Sarah Connor',
    clientEmail: 'sarah@cyberdyne-defense.io',
    clientCompany: 'Cyberdyne Defense Systems',
    clientAddress: '101 Research Parkway, Suite 400\nSan Jose, CA 95134',
    issueDate: '2026-07-01',
    validUntil: '2026-07-31',
    currency: 'NGN',
    items: [
      {
        id: 'item-1',
        description: 'AI System Security Architecture & Penetration Testing',
        quantity: 40,
        unitPrice: 175.00,
      },
      {
        id: 'item-2',
        description: 'Neural Net Processor Integration Consulting (per week)',
        quantity: 3,
        unitPrice: 2500.00,
      },
      {
        id: 'item-3',
        description: 'Compliance Documentation & Risk Assessment Report',
        quantity: 1,
        unitPrice: 1250.00,
      }
    ],
    taxRate: 8.5,
    discountPercentage: 5,
    notes: 'Thank you for your business. Please review deliverables before final signoff.',
    terms: 'Net 30 days. 50% deposit required upon quote acceptance.',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T10:30:00Z',
  },
  {
    id: 'quote-2',
    quoteNumber: 'QT-2026-002',
    status: 'Draft',
    clientName: 'Bruce Wayne',
    clientEmail: 'bruce@wayneenterprises.gotham',
    clientCompany: 'Wayne Enterprises R&D',
    clientAddress: '1007 Mountain Drive\nGotham, NY 10001',
    issueDate: '2026-07-10',
    validUntil: '2026-08-10',
    currency: 'NGN',
    items: [
      {
        id: 'item-201',
        description: 'Custom Armored Vehicle Telemetry Software',
        quantity: 1,
        unitPrice: 28500.00,
      },
      {
        id: 'item-202',
        description: 'Secure Encrypted Communications Handheld Units',
        quantity: 12,
        unitPrice: 850.00,
      }
    ],
    taxRate: 10,
    discountPercentage: 0,
    notes: 'Strictly confidential. Deliveries to Batcave subterranean freight bay.',
    terms: 'Due upon receipt. Wire transfer preferred.',
    createdAt: '2026-07-10T14:20:00Z',
    updatedAt: '2026-07-10T15:00:00Z',
  }
];
