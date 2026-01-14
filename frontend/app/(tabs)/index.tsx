import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useBalances } from '../../context/BalancesContext';
import { Card } from '../../components/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function HomeScreen() {
  const { user } = useAuth();
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

  const totalUSD = balances.USD || 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.firstName}! 👋</Text>
          <Text style={styles.date}>{formatDate(new Date())}</Text>
        </View>

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance (USD)</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalUSD, 'USD')}</Text>
          <Text style={styles.balanceHint}>
            View all wallets in the Wallets tab
          </Text>
        </Card>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <Card style={styles.actionCard}>
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💰</Text>
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>View All Wallets</Text>
                <Text style={styles.actionSubtitle}>
                  Check your {Object.keys(balances).length} currency wallets
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.actionCard}>
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💱</Text>
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Exchange Currency</Text>
                <Text style={styles.actionSubtitle}>
                  Convert between currencies at live rates
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.actionCard}>
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>👤</Text>
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Your Profile</Text>
                <Text style={styles.actionSubtitle}>
                  Manage account settings
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Tips</Text>
          <Text style={styles.infoText}>
            • Pull down to refresh your balances{'\n'}
            • Use the Wallets tab to see all currency balances{'\n'}
            • Exchange tab shows live rates and converts currencies{'\n'}
            • All changes update instantly across all tabs
          </Text>
        </View>
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
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  date: {
    fontSize: 15,
    color: '#8E8E93',
  },
  balanceCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#007AFF',
  },
  balanceLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  balanceHint: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  quickActions: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  actionCard: {
    marginBottom: 12,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoSection: {
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE066',
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});