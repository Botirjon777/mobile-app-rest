import * as SecureStore from 'expo-secure-store';

export const clearAllStorage = async (): Promise<void> => {
  try {
    // Clear all known keys
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
    console.log('✅ All storage cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};