export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  accountId: string;
  groupId?: string; // For installment groups
  tags?: string[];
  attachment?: {
    name: string;
    type: string;
    dataUrl: string;
  } | null;
}

export interface Account {
  id: string;
  name: string;
  color?: string;
  type?: 'checking' | 'savings' | 'wallet' | 'investment';
}

export interface Transfer {
  id: string;
  date: string;
  fromId: string;
  toId: string;
  amount: number;
  note?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number; // 1-31
  dueDay: number; // 1-31
  color?: string;
}

export interface CardPurchase {
  id: string;
  cardId: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  amount: number;
  invoiceMonth: string; // YYYY-MM
  paid: boolean;
  groupId?: string;
  nickname?: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  day: number; // 1-31
  amount: number;
  category: string;
  accountId: string;
  active: boolean;
  lastGenMonth?: string | null;
}

export type GoalKind = 'meta' | 'reserva' | 'objetivo';

export interface Goal {
  id: string;
  name: string;
  kind: GoalKind;
  target: number;
  saved: number;
  monthlyAmount?: number;
  accountId?: string | null;
  lastContribMonth?: string | null;
  createdDate: string;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  invested: number;
  current: number;
  date: string;
}

export type UserRole = 'admin' | 'user';
export type UserStatus = 'approved' | 'pending' | 'rejected';
export type UserPlan = 'free' | 'pro';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  plan?: UserPlan;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ThemeConfig {
  accent: string;
  bg: string;
  paper: string;
  wallpaper: string;
  wallpaperDim: number;
}

export interface UserSettings {
  appName: string;
  profileName: string;
  profilePhoto?: string;
  monthlySalary?: number;
  categories: string[];
  investmentTypes: string[];
  theme: ThemeConfig;
  themeMode?: 'light' | 'dark';
  hasCompletedSetup?: boolean;
}

export interface AppState {
  transactions: Transaction[];
  accounts: Account[];
  transfers: Transfer[];
  cards: CreditCard[];
  cardPurchases: CardPurchase[];
  recurringBills: RecurringBill[];
  goals: Goal[];
  investments: Investment[];
  settings: UserSettings;
}

export type TabPage =
  | 'overview'
  | 'transactions'
  | 'accounts'
  | 'investments'
  | 'goals'
  | 'annual'
  | 'reports'
  | 'calendar'
  | 'simulator'
  | 'settings'
  | 'admin';
