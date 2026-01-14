import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { BalancesProvider } from '../context/BalancesContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <BalancesProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </BalancesProvider>
    </AuthProvider>
  );
}