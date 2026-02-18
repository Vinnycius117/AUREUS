
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

export interface Asset {
  name: string;
  description: string;
  value: number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}
