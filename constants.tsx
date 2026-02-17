
import { Transaction, Asset } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const ASSETS: Asset[] = [
  {
    name: 'Stock Portfolio',
    description: 'Brokerage Holdings',
    value: 0,
    change: '0% Today',
    changeType: 'neutral',
    icon: 'show_chart'
  },
  {
    name: 'Cash & Equivalents',
    description: 'Liquid Assets',
    value: 0,
    change: 'Stable',
    changeType: 'neutral',
    icon: 'account_balance'
  }
];

export const SPENDING_MIX_DATA = [
  { name: 'Investments', value: 0, color: '#c6a84e' },
  { name: 'Lifestyle', value: 0, color: '#2A2A2A' },
  { name: 'Services', value: 0, color: '#8E793E' },
  { name: 'Travel', value: 0, color: '#B0B0B0' },
];

export const BALANCE_EVOLUTION_DATA = [
  { name: 'Start', value: 0 },
  { name: 'Today', value: 0 },
];

export const CASH_FLOW_DATA = [
  { name: 'Current Period', income: 0, expenses: 0 },
];
