import axios from 'axios';
import { ExchangeRate, HistoricalRate, ConversionResult } from '../types';

const NBP_BASE_URL = 'https://api.nbp.pl/api/exchangerates';

// Map currency codes to NBP codes
const NBP_CURRENCY_MAP: Record<string, string> = {
  'USD': 'usd',
  'EUR': 'eur',
  'GBP': 'gbp',
  'JPY': 'jpy',
  'CHF': 'chf',
  'CAD': 'cad',
  'AUD': 'aud',
  'CNY': 'cny',
};

interface NBPRateResponse {
  rates: Array<{
    mid: number;
    effectiveDate: string;
  }>;
}

export const nbpService = {
  // Get current exchange rate for a currency
  getCurrentRate: async (currency: string): Promise<ExchangeRate> => {
    try {
      const nbpCode = NBP_CURRENCY_MAP[currency];
      if (!nbpCode) {
        throw new Error(`Currency ${currency} not supported by NBP`);
      }
      
      const response = await axios.get<NBPRateResponse>(
        `${NBP_BASE_URL}/rates/a/${nbpCode}/?format=json`
      );
      
      return {
        currency,
        rate: response.data.rates[0].mid,
        date: response.data.rates[0].effectiveDate,
      };
    } catch (error) {
      console.error(`Error fetching rate for ${currency}:`, error);
      throw error;
    }
  },

  // Get historical rates for a currency
  getHistoricalRates: async (currency: string, days: number = 30): Promise<HistoricalRate[]> => {
    try {
      const nbpCode = NBP_CURRENCY_MAP[currency];
      if (!nbpCode) {
        throw new Error(`Currency ${currency} not supported by NBP`);
      }
      
      const response = await axios.get<NBPRateResponse>(
        `${NBP_BASE_URL}/rates/a/${nbpCode}/last/${days}/?format=json`
      );
      
      return response.data.rates.map(rate => ({
        date: rate.effectiveDate,
        rate: rate.mid,
      }));
    } catch (error) {
      console.error(`Error fetching historical rates for ${currency}:`, error);
      throw error;
    }
  },

  // Get all current rates
  getAllCurrentRates: async (): Promise<ExchangeRate[]> => {
    const currencies = Object.keys(NBP_CURRENCY_MAP);
    const promises = currencies.map(curr => 
      nbpService.getCurrentRate(curr).catch(() => null)
    );
    
    const results = await Promise.all(promises);
    return results.filter((r): r is ExchangeRate => r !== null);
  },

  // Convert amount from one currency to another using PLN as base
  convertCurrency: async (from: string, to: string, amount: number): Promise<ConversionResult> => {
    try {
      const [fromRate, toRate] = await Promise.all([
        nbpService.getCurrentRate(from),
        nbpService.getCurrentRate(to),
      ]);
      
      // Convert to PLN first, then to target currency
      const amountInPLN = amount * fromRate.rate;
      const convertedAmount = amountInPLN / toRate.rate;
      
      return {
        from,
        to,
        amount,
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        fromRate: fromRate.rate,
        toRate: toRate.rate,
      };
    } catch (error) {
      console.error('Error converting currency:', error);
      throw error;
    }
  },
};