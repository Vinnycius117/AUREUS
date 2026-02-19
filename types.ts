
export enum ViewType {
  ANALYTICS = 'analytics',
  PORTFOLIO = 'portfolio',
  TRANSACTIONS = 'transactions',
  MARKET_TRENDS = 'market_trends',
  SETTINGS = 'settings'
}

export interface Transaction {
  id: string;
  user_id?: string;
  details: string;
  reference?: string;
  account: string;
  date: string;
  timestamp: number;
  amount: number;
  icon: string;
  type: 'debit' | 'credit';
}

export type AssetCategory = 'Ações' | 'Renda Fixa' | 'FIIs' | 'Cripto' | 'Stocks' | 'Outros';
export type AssetStatus = 'liquid' | 'invested';

export interface PortfolioAsset {
  id: string;
  user_id?: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  current_value: number;
  target_percent: number;
  icon?: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  icon?: string;
  category?: string;
  created_at?: string;
}

// Legacy interface kept for compatibility
export interface Asset {
  name: string;
  description: string;
  value: number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}
