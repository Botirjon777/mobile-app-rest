import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { nbpService } from '../../services/nbp';
import { Card } from '../../components/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getCurrencyFlag } from '../../constants/currencies';
import { Balances, ExchangeRate } from '../../types';

export default function HomeScreen() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<Balances>({} as Balances);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = async (): Promise<void> => {
    try {
      const [balanceRes, ratesData] = await Promise.all([
        apiService.getBalance(),
        nbpService.getAllCurrentRates().catch(() => []),
      ]);

      setBalances(balanceRes.data.balances);
      setRates(ratesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const totalInUSD = Object.entries(balances).reduce((total, [currency, amount]) => {
    if (currency === 'USD') return total + amount;
    const rate = rates.find(r => r.currency === currency);
    if (rate) {
      return total + (amount / rate.rate);
    }
    return total;
  }, 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.firstName}! 👋</Text>
        <Text style={styles.date}>{formatDate(new Date())}</Text>
      </View>

      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Balance (Approx.)</Text>
        <Text style={styles.totalAmount}>{formatCurrency(totalInUSD, 'USD')}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Your Wallets</Text>
      {Object.entries(balances).map(([currency, amount]) => (
        <Card key={currency} style={styles.walletCard}>
          <View style={styles.walletRow}>
            <View style={styles.walletInfo}>
              <Text style={styles.currencyFlag}>{getCurrencyFlag(currency)}</Text>
              <View>
                <Text style={styles.currencyCode}>{currency}</Text>
                <Text style={styles.currencyAmount}>
                  {formatCurrency(amount, currency)}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      ))}

      <Text style={styles.sectionTitle}>Exchange Rates (vs PLN)</Text>
      {rates.length > 0 ? (
        rates.map((rate) => (
          <Card key={rate.currency} style={styles.rateCard}>
            <View style={styles.rateRow}>
              <View style={styles.rateInfo}>
                <Text style={styles.rateFlag}>{getCurrencyFlag(rate.currency)}</Text>
                <Text style={styles.rateCurrency}>{rate.currency}</Text>
              </View>
              <Text style={styles.rateValue}>{rate.rate.toFixed(4)} PLN</Text>
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.noData}>Exchange rates not available</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  date: {
    fontSize: 15,
    color: '#8E8E93',
  },
  totalCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#007AFF',
  },
  totalLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginHorizontal: 24,
    marginBottom: 12,
    marginTop: 8,
  },
  walletCard: {
    marginHorizontal: 24,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  currencyCode: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 4,
  },
  currencyAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  rateCard: {
    marginHorizontal: 24,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  rateCurrency: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  rateValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  noData: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
});