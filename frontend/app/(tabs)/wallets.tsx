import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useBalances } from '../../context/BalancesContext';
import { Card } from '../../components/Card';
import { formatCurrency } from '../../utils/formatters';
import { CURRENCIES } from '../../constants/currencies';

export default function WalletsScreen() {
  const { balances, loading, refreshBalances } = useBalances();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBalances();
    setRefreshing(false);
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Wallets</Text>
        <Text style={styles.subtitle}>
          Manage your {CURRENCIES.length} currency wallets
        </Text>
      </View>

      {CURRENCIES.map((currency) => {
        const balance = balances[currency.value] || 0;
        const isEmpty = balance === 0;
        
        return (
          <Card key={currency.value} style={[styles.walletCard, isEmpty && styles.emptyWallet]}>
            <View style={styles.walletRow}>
              <View style={styles.walletLeft}>
                <Text style={styles.currencyFlag}>{currency.flag}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyName}>{currency.label}</Text>
                  <Text style={styles.currencyCode}>{currency.value}</Text>
                </View>
              </View>
              <View style={styles.walletRight}>
                <Text style={[styles.balanceAmount, isEmpty && styles.emptyAmount]}>
                  {formatCurrency(balance, currency.value)}
                </Text>
                <Text style={styles.balanceLabel}>Balance</Text>
              </View>
            </View>
          </Card>
        );
      })}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Use the Exchange tab to convert between currencies
        </Text>
        <Text style={styles.footerText}>
          ⚡ Pull down to refresh your balances
        </Text>
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  walletCard: {
    marginHorizontal: 24,
    marginBottom: 12,
  },
  emptyWallet: {
    opacity: 0.6,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyFlag: {
    fontSize: 36,
    marginRight: 16,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 14,
    color: '#8E8E93',
  },
  walletRight: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  emptyAmount: {
    color: '#8E8E93',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  footer: {
    padding: 24,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
});