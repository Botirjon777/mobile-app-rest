import { getCurrencySymbol } from '../constants/currencies';

export const formatCurrency = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency);
  const formatted = parseFloat(amount.toString()).toFixed(2);
  return `${symbol}${formatted}`;
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${month}/${day}/${year} ${hours}:${minutes}`;
};

export const formatNumber = (num: number): string => {
  return parseFloat(num.toString()).toFixed(2);
};