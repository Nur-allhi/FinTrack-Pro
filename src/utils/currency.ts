const RATE_CACHE_KEY = 'exchange_rates';
const RATE_CACHE_TTL = 3600000; // 1 hour

let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedRates && now - cacheTimestamp < RATE_CACHE_TTL) return cachedRates;

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('Failed to fetch rates');
    const data = await res.json();
    cachedRates = data.rates;
    cacheTimestamp = now;
    localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rates: cachedRates, timestamp: cacheTimestamp }));
    return cachedRates!;
  } catch {
    const stored = localStorage.getItem(RATE_CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedRates = parsed.rates;
      cacheTimestamp = parsed.timestamp;
      return cachedRates!;
    }
    return { USD: 1 };
  }
}

export async function convertAmount(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  const rates = await getExchangeRates();
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  return (amount / fromRate) * toRate;
}

export function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', BDT: '৳', INR: '₹',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', MYR: 'RM', THB: '฿',
    PHP: '₱', IDR: 'Rp', VND: '₫', KRW: '₩', CNY: '¥',
  };
  return symbols[code] || code + ' ';
}

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'BDT', label: 'BDT — Bangladeshi Taka' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { value: 'THB', label: 'THB — Thai Baht' },
  { value: 'PHP', label: 'PHP — Philippine Peso' },
  { value: 'IDR', label: 'IDR — Indonesian Rupiah' },
  { value: 'CNY', label: 'CNY — Chinese Yuan' },
  { value: 'KRW', label: 'KRW — South Korean Won' },
];
