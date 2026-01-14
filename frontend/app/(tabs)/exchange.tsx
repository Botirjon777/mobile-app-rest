import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useBalances } from '../../context/BalancesContext';
import { apiService } from '../../services/api';
import { nbpService } from '../../services/nbp';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CURRENCIES } from '../../constants/currencies';
import { formatCurrency } from '../../utils/formatters';
import { ExchangeRate } from '../../types';

export default function ExchangeScreen() {
  const { balances, refreshBalances } = useBalances();
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [showRates, setShowRates] = useState<boolean>(false);
  const [loadingRates, setLoadingRates] = useState<boolean>(false);

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      calculateExchange();
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromCurrency, toCurrency]);

  const fetchRates = async (): Promise<void> => {
    setLoadingRates(true);
    try {
      const ratesData = await nbpService.getAllCurrentRates();
      setRates(ratesData);
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoadingRates(false);
    }
  };

  const calculateExchange = async (): Promise<void> => {
    if (fromCurrency === toCurrency) {
      setToAmount(fromAmount);
      return;
    }

    setCalculating(true);
    try {
      const amount = parseFloat(fromAmount);
      
      // Check if currencies are supported by NBP
      const unsupportedCurrencies = ['UZS', 'INR'];
      const fromUnsupported = unsupportedCurrencies.includes(fromCurrency);
      const toUnsupported = unsupportedCurrencies.includes(toCurrency);
      
      if (fromUnsupported || toUnsupported) {
        // For unsupported currencies, use a simple conversion rate
        let conversionRate = 1.0;
        
        // Define custom rates for unsupported currencies (relative to USD)
        const customRates: Record<string, number> = {
          'UZS': 0.000082, // 1 UZS = 0.000082 USD (approximate)
          'INR': 0.012,    // 1 INR = 0.012 USD (approximate)
          'USD': 1.0,
        };
        
        if (fromUnsupported && toUnsupported) {
          // Both unsupported, convert through USD
          conversionRate = customRates[fromCurrency] / customRates[toCurrency];
        } else if (fromUnsupported) {
          // From is unsupported, get TO rate from NBP
          const toRate = await nbpService.getCurrentRate(toCurrency);
          // Convert: UZS -> USD -> PLN -> TO
          const usdToPln = rates.find(r => r.currency === 'USD')?.rate || 4.0;
          conversionRate = (customRates[fromCurrency] * usdToPln) / toRate.rate;
        } else {
          // To is unsupported, get FROM rate from NBP
          const fromRate = await nbpService.getCurrentRate(fromCurrency);
          // Convert: FROM -> PLN -> USD -> UZS
          const usdToPln = rates.find(r => r.currency === 'USD')?.rate || 4.0;
          conversionRate = (fromRate.rate / usdToPln) / customRates[toCurrency];
        }
        
        setToAmount((amount * conversionRate).toFixed(2));
        setCalculating(false);
        return;
      }

      // Both currencies supported by NBP
      const result = await nbpService.convertCurrency(fromCurrency, toCurrency, amount);
      setToAmount(result.convertedAmount.toString());
    } catch (error) {
      console.error('Error calculating exchange:', error);
      // Fallback to simple 1:1 conversion with 2% fee
      const amount = parseFloat(fromAmount);
      setToAmount((amount * 0.98).toFixed(2));
    } finally {
      setCalculating(false);
    }
  };

  const handleExchange = async (): Promise<void> => {
    const fromAmt = parseFloat(fromAmount);
    const toAmt = parseFloat(toAmount);

    // Validation checks
    if (!fromAmt || !toAmt || fromAmt <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (fromCurrency === toCurrency) {
      Alert.alert('Error', 'Please select different currencies');
      return;
    }

    // Check sufficient balance
    const availableBalance = balances[fromCurrency] || 0;
    if (availableBalance < fromAmt) {
      Alert.alert(
        'Insufficient Balance',
        `You don't have enough ${fromCurrency}.\n\nAvailable: ${formatCurrency(availableBalance, fromCurrency)}\nRequired: ${formatCurrency(fromAmt, fromCurrency)}`
      );
      return;
    }

    // Confirm exchange
    Alert.alert(
      'Confirm Exchange',
      `Exchange ${formatCurrency(fromAmt, fromCurrency)} to ${formatCurrency(toAmt, toCurrency)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              await apiService.exchange({
                fromCurrency,
                toCurrency,
                fromAmount: fromAmt,
                toAmount: toAmt,
              });

              // Refresh balances immediately
              await refreshBalances();

              Alert.alert(
                'Success! 🎉',
                `Successfully exchanged:\n${formatCurrency(fromAmt, fromCurrency)} → ${formatCurrency(toAmt, toCurrency)}\n\nYour new ${toCurrency} balance: ${formatCurrency((balances[toCurrency] || 0) + toAmt, toCurrency)}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setFromAmount('');
                      setToAmount('');
                    }
                  }
                ]
              );
            } catch (error: any) {
              console.error('Exchange error:', error);
              Alert.alert('Error', error.response?.data?.message || 'Exchange failed');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const pickerItems = CURRENCIES.map(c => ({
    label: `${c.flag} ${c.value} - ${c.label}`,
    value: c.value,
  }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Currency Exchange</Text>
        </View>

        <TouchableOpacity 
          style={styles.ratesButton}
          onPress={() => {
            setShowRates(!showRates);
            if (!showRates) fetchRates();
          }}
        >
          <Text style={styles.ratesButtonText}>
            {showRates ? '✕ Hide Exchange Rates' : '📊 View Exchange Rates'}
          </Text>
        </TouchableOpacity>

        {showRates && (
          <Card style={styles.ratesCard}>
            <View style={styles.ratesHeader}>
              <Text style={styles.ratesTitle}>Live Exchange Rates (vs PLN)</Text>
              <TouchableOpacity onPress={fetchRates}>
                <Text style={styles.refreshText}>🔄 Refresh</Text>
              </TouchableOpacity>
            </View>
            {loadingRates ? (
              <ActivityIndicator color="#007AFF" style={{ marginTop: 12 }} />
            ) : rates.length > 0 ? (
              <>
                {rates.map((rate) => (
                  <View key={rate.currency} style={styles.rateRow}>
                    <Text style={styles.rateCurrency}>
                      {CURRENCIES.find(c => c.value === rate.currency)?.flag} {rate.currency}
                    </Text>
                    <Text style={styles.rateValue}>{rate.rate.toFixed(4)} PLN</Text>
                  </View>
                ))}
                <Text style={styles.rateNote}>
                  Note: UZS and INR use approximate rates
                </Text>
              </>
            ) : (
              <Text style={styles.noRates}>Rates not available</Text>
            )}
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.label}>From Wallet</Text>
          <RNPickerSelect
            onValueChange={setFromCurrency}
            items={pickerItems}
            value={fromCurrency}
            style={pickerSelectStyles}
          />
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>
              Available: {formatCurrency(balances[fromCurrency] || 0, fromCurrency)}
            </Text>
            {(balances[fromCurrency] || 0) > 0 && (
              <TouchableOpacity 
                onPress={() => setFromAmount((balances[fromCurrency] || 0).toString())}
              >
                <Text style={styles.maxButton}>Use Max</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        <Card style={styles.card}>
          <Input
            label="Amount to Exchange"
            value={fromAmount}
            onChangeText={setFromAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </Card>

        <View style={styles.swapIconContainer}>
          <TouchableOpacity
            onPress={() => {
              const temp = fromCurrency;
              setFromCurrency(toCurrency);
              setToCurrency(temp);
            }}
            style={styles.swapButton}
          >
            <Text style={styles.swapIcon}>⇅</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.card}>
          <Text style={styles.label}>To Wallet</Text>
          <RNPickerSelect
            onValueChange={setToCurrency}
            items={pickerItems}
            value={toCurrency}
            style={pickerSelectStyles}
          />
          <Text style={styles.balanceAfter}>
            Current: {formatCurrency(balances[toCurrency] || 0, toCurrency)}
          </Text>
        </Card>

        <Card style={styles.resultCard}>
          <Text style={styles.label}>You will receive</Text>
          {calculating ? (
            <View style={styles.calculatingContainer}>
              <ActivityIndicator color="#34C759" />
              <Text style={styles.calculatingText}>Calculating...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultAmount}>
                {toAmount ? formatCurrency(parseFloat(toAmount), toCurrency) : '0.00'}
              </Text>
              {toAmount && (
                <Text style={styles.newBalance}>
                  New balance: {formatCurrency((balances[toCurrency] || 0) + parseFloat(toAmount), toCurrency)}
                </Text>
              )}
            </>
          )}
        </Card>

        <Button
          title={`Exchange ${fromCurrency} → ${toCurrency}`}
          onPress={handleExchange}
          loading={loading}
          disabled={!fromAmount || !toAmount || calculating || fromCurrency === toCurrency || parseFloat(fromAmount) <= 0}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Exchange any currency to any other currency
          </Text>
          <Text style={styles.infoText}>
            📊 Rates from National Bank of Poland API
          </Text>
          <Text style={styles.infoText}>
            ⚡ Balances update instantly after exchange
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
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  ratesButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  ratesButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  ratesCard: {
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  ratesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratesTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  refreshText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  rateCurrency: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  rateValue: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  rateNote: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
  },
  noRates: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  balance: {
    fontSize: 13,
    color: '#8E8E93',
  },
  maxButton: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  balanceAfter: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 8,
  },
  swapIconContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapIcon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  resultCard: {
    marginBottom: 16,
    backgroundColor: '#E8F5E9',
  },
  calculatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  calculatingText: {
    fontSize: 16,
    color: '#34C759',
    marginLeft: 8,
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#34C759',
    marginTop: 8,
  },
  newBalance: {
    fontSize: 13,
    color: '#34C759',
    marginTop: 8,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 6,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 17,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    color: '#000000',
  },
  inputAndroid: {
    fontSize: 17,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    color: '#000000',
  },
};