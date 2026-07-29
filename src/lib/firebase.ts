import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Quotation, BoqDocument, InvoiceRecord, InventoryItem } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Save User record in Firestore upon sign in / register
export async function saveUserRecord(user: { uid: string; email: string | null; displayName?: string | null; photoURL?: string | null }) {
  if (!user.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save user record to Firestore:', err);
  }
}

// Quotation Firestore Operations
export async function saveQuotationToFirestore(userId: string, quote: Quotation) {
  if (!userId || !quote.id) return;
  try {
    const quoteRef = doc(db, 'users', userId, 'quotations', quote.id);
    await setDoc(quoteRef, {
      ...quote,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save quotation to Firestore:', err);
  }
}

export async function fetchQuotationsFromFirestore(userId: string): Promise<Quotation[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'quotations');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data() as Quotation);
  } catch (err) {
    console.error('Failed to fetch quotations from Firestore:', err);
    return [];
  }
}

export async function deleteQuotationFromFirestore(userId: string, quoteId: string) {
  if (!userId || !quoteId) return;
  try {
    const quoteRef = doc(db, 'users', userId, 'quotations', quoteId);
    await deleteDoc(quoteRef);
  } catch (err) {
    console.error('Failed to delete quotation from Firestore:', err);
  }
}

// BOQ Firestore Operations
export async function saveBoqToFirestore(userId: string, boq: BoqDocument) {
  if (!userId || !boq.id) return;
  try {
    const boqRef = doc(db, 'users', userId, 'boqs', boq.id);
    await setDoc(boqRef, {
      ...boq,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save BOQ to Firestore:', err);
  }
}

export async function fetchBoqsFromFirestore(userId: string): Promise<BoqDocument[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'boqs');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data() as BoqDocument);
  } catch (err) {
    console.error('Failed to fetch BOQs from Firestore:', err);
    return [];
  }
}

// Invoice Firestore Operations
export async function saveInvoiceToFirestore(userId: string, invoice: InvoiceRecord) {
  if (!userId || !invoice.id) return;
  try {
    const invRef = doc(db, 'users', userId, 'invoices', invoice.id);
    await setDoc(invRef, {
      ...invoice,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save invoice to Firestore:', err);
  }
}

export async function fetchInvoicesFromFirestore(userId: string): Promise<InvoiceRecord[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'invoices');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data() as InvoiceRecord);
  } catch (err) {
    console.error('Failed to fetch invoices from Firestore:', err);
    return [];
  }
}

// Inventory Firestore Operations
export async function saveInventoryToFirestore(userId: string, item: InventoryItem) {
  if (!userId || !item.id) return;
  try {
    const itemRef = doc(db, 'users', userId, 'inventory', item.id);
    await setDoc(itemRef, {
      ...item,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save inventory item to Firestore:', err);
  }
}

export async function fetchInventoryFromFirestore(userId: string): Promise<InventoryItem[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'inventory');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data() as InventoryItem);
  } catch (err) {
    console.error('Failed to fetch inventory items from Firestore:', err);
    return [];
  }
}

export async function deleteInventoryFromFirestore(userId: string, itemId: string) {
  if (!userId || !itemId) return;
  try {
    const itemRef = doc(db, 'users', userId, 'inventory', itemId);
    await deleteDoc(itemRef);
  } catch (err) {
    console.error('Failed to delete inventory item from Firestore:', err);
  }
}

// Report Firestore Operations
export interface ReportRecord {
  id: string;
  title: string;
  period: string;
  summary: string;
  status: 'Sent' | 'Draft' | 'Generated';
  updatedAt: string;
}

export async function saveReportToFirestore(userId: string, report: ReportRecord) {
  if (!userId || !report.id) return;
  try {
    const repRef = doc(db, 'users', userId, 'reports', report.id);
    await setDoc(repRef, {
      ...report,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save report to Firestore:', err);
  }
}

export async function fetchReportsFromFirestore(userId: string): Promise<ReportRecord[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'reports');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data() as ReportRecord);
  } catch (err) {
    console.error('Failed to fetch reports from Firestore:', err);
    return [];
  }
}
