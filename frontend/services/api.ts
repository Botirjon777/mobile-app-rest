import axios, { AxiosInstance } from 'axios';
import { storage } from './storage';
import {
  LoginCredentials,
  RegisterData,
  TransferRequest,
  ExchangeRequest,
  BalanceResponse,
  TransactionHistoryResponse,
  TransactionDetailResponse,
  UsersResponse,
  User
} from '../types';

// CHANGE THIS TO YOUR BACKEND URL
const API_BASE_URL = 'http://192.168.1.102:5000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      await storage.clearAll();
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth endpoints
  signup: (data: RegisterData) => api.post('/user/signup', data),
  signin: (data: LoginCredentials) => api.post('/user/signin', data),
  getUser: () => api.get<User>('/user/getUser'),
  
  // User endpoints
  getAllUsers: () => api.get<UsersResponse>('/user/getAllUsers'),
  bulkSearch: (filter: string) => api.get<UsersResponse>('/user/bulk', { params: { filter } }),
  getOtherUsers: (filter: string) => api.get<UsersResponse>('/user/otherusers', { params: { filter } }),
  
  // Account endpoints
  getBalance: () => api.get<BalanceResponse>('/account/balance'),
  transfer: (data: TransferRequest) => api.post('/account/transfer', data),
  exchange: (data: ExchangeRequest) => api.post('/account/exchange', data),
  
  // Transaction endpoints
  getTransactionHistory: () => api.get<TransactionHistoryResponse>('/transaction/history'),
  getTransaction: (id: string) => api.get<TransactionDetailResponse>(`/transaction/history/${id}`),
};

export default api;