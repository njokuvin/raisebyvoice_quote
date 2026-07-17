import { Quotation } from '../types';

export function calculateSubtotal(quote: Quotation): number {
  return quote.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
}

export function calculateDiscountAmount(quote: Quotation): number {
  const subtotal = calculateSubtotal(quote);
  return subtotal * ((quote.discountPercentage || 0) / 100);
}

export function calculateTaxAmount(quote: Quotation): number {
  const subtotal = calculateSubtotal(quote);
  const discountAmount = calculateDiscountAmount(quote);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  return taxableAmount * ((quote.taxRate || 0) / 100);
}

export function calculateGrandTotal(quote: Quotation): number {
  const subtotal = calculateSubtotal(quote);
  const discountAmount = calculateDiscountAmount(quote);
  const taxAmount = calculateTaxAmount(quote);
  return Math.max(0, subtotal - discountAmount + taxAmount);
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (e) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function generateNewQuoteId(): string {
  return 'quote-' + Math.random().toString(36).substring(2, 9);
}

export function generateQuoteNumber(): string {
  const defaultBase = 'QT-2026-002';
  let lastNumber = defaultBase;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('voicequota_last_quote_number');
      if (saved) {
        lastNumber = saved;
      }
    }
  } catch (e) {
    console.error('Error loading last quote number serial:', e);
  }

  // Parse trailing numeric digits and increment
  const match = lastNumber.match(/^(.*?)(\d+)$/);
  let nextNumber = '';
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const nextVal = parseInt(numStr, 10) + 1;
    // maintain padded length (e.g. 003, 012, 100)
    const paddedNum = String(nextVal).padStart(numStr.length, '0');
    nextNumber = `${prefix}${paddedNum}`;
  } else {
    nextNumber = 'QT-2026-003';
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('voicequota_last_quote_number', nextNumber);
    }
  } catch (e) {
    console.error('Error saving last quote number serial:', e);
  }

  return nextNumber;
}

export function updateLastQuoteNumberCache(quotes: Quotation[]): void {
  if (!quotes || quotes.length === 0) return;
  let maxVal = -1;
  let maxQuoteNumStr = '';

  quotes.forEach((q) => {
    if (!q.quoteNumber) return;
    const match = q.quoteNumber.match(/(\d+)$/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxVal) {
        maxVal = val;
        maxQuoteNumStr = q.quoteNumber;
      }
    }
  });

  if (maxQuoteNumStr) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('voicequota_last_quote_number', maxQuoteNumStr);
      }
    } catch (e) {
      console.error('Error updating last quote number cache:', e);
    }
  }
}

export function cleanDuplicateWords(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let words = text.trim().split(/\s+/);
  if (words.length <= 1) return text;

  let cleaned: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    const prevWord = cleaned[cleaned.length - 1];
    if (!prevWord || currentWord.toLowerCase() !== prevWord.toLowerCase()) {
      cleaned.push(currentWord);
    }
  }

  // Remove consecutive duplicate sequences of 2 or 3 words (e.g. "Net 30 Net 30" -> "Net 30")
  let resultWords = cleaned;
  for (let len = 2; len <= 4; len++) {
    let temp: string[] = [];
    let i = 0;
    while (i < resultWords.length) {
      if (i + 2 * len <= resultWords.length) {
        let seq1 = resultWords.slice(i, i + len).join(' ').toLowerCase();
        let seq2 = resultWords.slice(i + len, i + 2 * len).join(' ').toLowerCase();
        if (seq1 === seq2) {
          temp.push(...resultWords.slice(i, i + len));
          i += 2 * len;
          continue;
        }
      }
      temp.push(resultWords[i]);
      i++;
    }
    resultWords = temp;
  }

  return resultWords.join(' ');
}

