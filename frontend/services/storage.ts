import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const storage = {
  saveToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  clearToken: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  },

  saveUser: async (userData: User): Promise<void> => {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  getUser: async (): Promise<User | null> => {
    try {
      const user = await SecureStore.getItemAsync(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  clearUser: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error('Error clearing user:', error);
    }
  },

  clearAll: async (): Promise<void> => {
    await storage.clearToken();
    await storage.clearUser();
  }
};