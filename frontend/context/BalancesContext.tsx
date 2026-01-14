// context/BalancesContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { Balances } from '../types';
import { useAuth } from './AuthContext';

interface BalancesContextType {
  balances: Balances;
  loading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  updateBalances: (newBalances: Balances) => void;
}

const BalancesContext = createContext<BalancesContextType | undefined>(undefined);

interface BalancesProviderProps {
  children: ReactNode;
}

export const BalancesProvider: React.FC<BalancesProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [balances, setBalances] = useState<Balances>({
    USD: 0,
    EUR: 0,
    GBP: 0,
    INR: 0,
    JPY: 0,
    UZS: 0,
    CAD: 0,
    AUD: 0,
    CHF: 0,
    CNY: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalances = async (): Promise<void> => {
    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping balance fetch');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching balances...');
      const res = await apiService.getBalance();
      console.log('Balances fetched successfully');
      setBalances(res.data.balances);
    } catch (error: any) {
      console.error('Error fetching balances:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBalances = (newBalances: Balances): void => {
    setBalances(newBalances);
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshBalances();
    }
  }, [isAuthenticated]);

  return (
    <BalancesContext.Provider
      value={{
        balances,
        loading,
        error,
        refreshBalances,
        updateBalances,
      }}
    >
      {children}
    </BalancesContext.Provider>
  );
};

export const useBalances = (): BalancesContextType => {
  const context = useContext(BalancesContext);
  if (!context) {
    throw new Error('useBalances must be used within a BalancesProvider');
  }
  return context;
};