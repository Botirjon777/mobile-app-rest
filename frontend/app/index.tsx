import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      console.log('Still loading auth state...');
      return;
    }

    console.log('Auth state loaded. Authenticated:', isAuthenticated);

    // Small delay to ensure everything is ready
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        console.log('Redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('Redirecting to login');
        router.replace('/(auth)/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
});