import { Currency, CurrencyCode } from '../types';

export const CURRENCIES: Currency[] = [
  { label: 'US Dollar', value: 'USD', symbol: '$', flag: '🇺🇸' },
  { label: 'Euro', value: 'EUR', symbol: '€', flag: '🇪🇺' },
  { label: 'British Pound', value: 'GBP', symbol: '£', flag: '🇬🇧' },
  { label: 'Indian Rupee', value: 'INR', symbol: '₹', flag: '🇮🇳' },
  { label: 'Japanese Yen', value: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { label: 'Uzbek Som', value: 'UZS', symbol: 'so\'m', flag: '🇺🇿' },
  { label: 'Canadian Dollar', value: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { label: 'Australian Dollar', value: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { label: 'Swiss Franc', value: 'CHF', symbol: 'CHF', flag: '🇨🇭' },
  { label: 'Chinese Yuan', value: 'CNY', symbol: '¥', flag: '🇨🇳' },
];

export const getCurrencySymbol = (code: string): string => {
  const currency = CURRENCIES.find(c => c.value === code);
  return currency ? currency.symbol : code;
};

export const getCurrencyFlag = (code: string): string => {
  const currency = CURRENCIES.find(c => c.value === code);
  return currency ? currency.flag : '';
};