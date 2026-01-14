// User types
export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface UserWithId extends User {
  userid: string;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Currency types
export interface Currency {
  label: string;
  value: string;
  symbol: string;
  flag: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'UZS' | 'CAD' | 'AUD' | 'CHF' | 'CNY';

export interface Balances {
  [key: string]: number;
  USD: number;
  EUR: number;
  GBP: number;
  INR: number;
  JPY: number;
  UZS: number;
  CAD: number;
  AUD: number;
  CHF: number;
  CNY: number;
}

// Transaction types
export type TransactionType = 'send' | 'exchange';

export interface Transaction {
  _id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: string | Date;
  senderName: string;
  targetName: string;
}

export interface TransactionDetail extends Transaction {
  userId?: string;
  targetId?: string;
}

// API Request/Response types
export interface TransferRequest {
  to: string;
  currency: string;
  amount: number;
}

export interface ExchangeRequest {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
}

export interface BalanceResponse {
  balances: Balances;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
}

export interface TransactionDetailResponse {
  transaction: TransactionDetail;
}

export interface UsersResponse {
  users: UserWithId[];
}

// NBP API types
export interface ExchangeRate {
  currency: string;
  rate: number;
  date: string;
}

export interface HistoricalRate {
  date: string;
  rate: number;
}

export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  fromRate: number;
  toRate: number;
}

// Component prop types
export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: any;
}

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad';
  error?: string;
  style?: any;
  [key: string]: any;
}

export interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}