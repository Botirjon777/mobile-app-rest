import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { storage } from '../services/storage';
import { apiService } from '../services/api';
import { AuthContextType, User, RegisterData, AuthResponse } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      console.log('Checking auth status...');
      const token = await storage.getToken();
      const savedUser = await storage.getUser();
      
      if (token && savedUser) {
        console.log('Found saved user:', savedUser.username);
        setUser(savedUser);
        setIsAuthenticated(true);
      } else {
        console.log('No saved user found');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('Attempting login for:', username);
      const response = await apiService.signin({ username, password });
      const { token } = response.data;
      
      console.log('Login successful, saving token');
      await storage.saveToken(token);
      
      // Fetch user data
      const userResponse = await apiService.getUser();
      const userData = userResponse.data;
      
      console.log('Fetched user data:', userData);
      await storage.saveUser(userData);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      console.log('Attempting registration for:', userData.username);
      const response = await apiService.signup(userData);
      const { token } = response.data;
      
      console.log('Registration successful, saving token');
      await storage.saveToken(token);
      
      // Fetch complete user data
      const userResponse = await apiService.getUser();
      const completeUserData = userResponse.data;
      
      console.log('Fetched user data after registration:', completeUserData);
      await storage.saveUser(completeUserData);
      setUser(completeUserData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out user...');
      // Clear storage
      await storage.clearAll();
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userResponse = await apiService.getUser();
      const userData = userResponse.data;
      await storage.saveUser(userData);
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};