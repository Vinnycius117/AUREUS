
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TransactionsHistory from './components/TransactionsHistory';
import AddTransactionModal from './components/AddTransactionModal';
import SettingsScreen from './components/SettingsScreen';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { ViewType, Transaction } from './types';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

type AuthScreen = 'LOGIN' | 'REGISTER';

const App: React.FC = () => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('LOGIN');
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.ANALYTICS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // ── Auth listener ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load transactions from Supabase when user changes ──────────────
  const loadTransactions = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error.message);
      // Fallback: try loading from localStorage
      const localData = localStorage.getItem(`transactions_${user.id}`);
      if (localData) {
        try {
          setTransactions(JSON.parse(localData));
        } catch { /* ignore */ }
      }
    } else {
      setTransactions(data || []);
      // Sync to localStorage as backup
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(data || []));
    }

    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTransactions();
    } else {
      setTransactions([]);
    }
  }, [user, loadTransactions]);

  // ── Save transaction (Supabase + localStorage backup) ──────────────
  const handleAddTransaction = async (newTx: Transaction) => {
    const txWithUser = { ...newTx, user_id: user!.id };

    // Optimistic update
    setTransactions(prev => [txWithUser, ...prev]);

    const { error } = await supabase
      .from('transactions')
      .insert([txWithUser]);

    if (error) {
      console.error('Error saving transaction:', error.message);
      // Still keep it locally
    }

    // Sync localStorage backup with the absolute latest state
    setTransactions(prev => {
      const updated = [txWithUser, ...prev.filter(t => t.id !== txWithUser.id)];
      localStorage.setItem(`transactions_${user!.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  // ── Delete transaction ─────────────────────────────────────────────
  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      // Optimistic update
      setTransactions(prev => prev.filter(t => t.id !== id));

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) {
        console.error('Error deleting transaction:', error.message);
      }

      // Sync localStorage backup with the absolute latest state
      setTransactions(prev => {
        const updated = prev.filter(t => t.id !== id);
        localStorage.setItem(`transactions_${user!.id}`, JSON.stringify(updated));
        return updated;
      });
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTransactions([]);
  };

  // ── Auth loading spinner ───────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ── Auth screens ───────────────────────────────────────────────────
  if (!user) {
    if (authScreen === 'REGISTER') {
      return <RegisterScreen onNavigate={setAuthScreen} />;
    }
    return <LoginScreen onNavigate={setAuthScreen} />;
  }

  // ── Dashboard ──────────────────────────────────────────────────────
  const renderView = () => {
    switch (currentView) {
      case ViewType.ANALYTICS:
        return <AnalyticsDashboard transactions={transactions} onDeleteTransaction={handleDeleteTransaction} />;
      case ViewType.TRANSACTIONS:
        return (
          <TransactionsHistory
            transactions={transactions}
            onOpenModal={() => setIsModalOpen(true)}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case ViewType.SETTINGS:
        return <SettingsScreen user={user!} />;
      case ViewType.PORTFOLIO:
        return (
          <div className="flex-1 flex items-center justify-center bg-background-dark text-slate-500">
            <div className="text-center">
              <span className="material-icons text-6xl mb-4 opacity-10">account_balance</span>
              <h2 className="text-xl font-semibold text-slate-400">Portfolio View</h2>
              <p className="text-sm">Consolidated asset management dashboard coming soon.</p>
              <button
                onClick={() => setCurrentView(ViewType.ANALYTICS)}
                className="mt-6 px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
              >
                Go to Analytics
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-background-dark text-slate-500">
            <div className="text-center">
              <span className="material-icons text-6xl mb-4 opacity-10">construction</span>
              <h2 className="text-xl font-semibold text-slate-400">Under Construction</h2>
              <p className="text-sm">This module is part of the upcoming Q4 update.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-slate-100 font-sans">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} user={user} />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {dataLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          renderView()
        )}

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/3 rounded-full blur-[100px] pointer-events-none -ml-24 -mb-24"></div>
      </main>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTransaction}
      />
    </div>
  );
};

export default App;
