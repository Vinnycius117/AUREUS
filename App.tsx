
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
  const [isPro, setIsPro] = useState(false);

  // ── Load subscription status ──────────────────────────────────────
  const loadSubscription = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, plan_type')
      .eq('user_id', user.id)
      .single();

    if (data && data.status === 'active' && data.plan_type === 'pro') {
      setIsPro(true);
    } else {
      setIsPro(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user, loadSubscription]);

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

  // ── Load transactions from Supabase ───────────────────────────────
  const loadTransactions = useCallback(async () => {
    if (!user) return;

    // Load from cache first for zero-latency startup
    const cached = localStorage.getItem(`aureus_tx_${user.id}`);
    if (cached && transactions.length === 0) {
      try {
        setTransactions(JSON.parse(cached));
      } catch (e) {
        console.error('Cache error:', e);
      }
    }

    setDataLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error.message);
      // Don't clear transactions here if we have cached data,
      // but warn the user.
      if (transactions.length === 0 && !cached) {
        setTransactions([]);
      }
    } else {
      setTransactions(data || []);
      // Sync cache
      localStorage.setItem(`aureus_tx_${user.id}`, JSON.stringify(data || []));
    }

    setDataLoading(false);
  }, [user, transactions.length]);

  useEffect(() => {
    if (user) {
      loadTransactions();
    } else {
      setTransactions([]);
    }
  }, [user, loadTransactions]);

  // ── Save transaction ──────────────────────────────────────────────
  const handleAddTransaction = async (newTx: Transaction) => {
    if (!user) return;
    const txWithUser = { ...newTx, user_id: user.id };

    // 1. Optimistic Update (UI)
    const updatedTransactions = [txWithUser, ...transactions];
    setTransactions(updatedTransactions);

    // 2. Persistent Cache Update (Survives reload even if DB fails)
    localStorage.setItem(`aureus_tx_${user.id}`, JSON.stringify(updatedTransactions));

    // 3. Remote Sync
    const { error } = await supabase
      .from('transactions')
      .insert([txWithUser]);

    if (error) {
      console.error('Supabase Save Error:', error.message);
      alert(`⚠️ Erro ao salvar no banco de dados: ${error.message}\n\nO item foi salvo localmente mas pode não aparecer em outros dispositivos até que o erro seja resolvido.`);
      // We don't call loadTransactions() here because we want to keep the local data 
      // even if Supabase failed.
    }
  };

  // ── Delete transaction ─────────────────────────────────────────────
  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      const updatedTransactions = transactions.filter(t => t.id !== id);

      // 1. Optimistic Update
      setTransactions(updatedTransactions);

      // 2. Cache Update
      localStorage.setItem(`aureus_tx_${user!.id}`, JSON.stringify(updatedTransactions));

      // 3. Remote Delete
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) {
        console.error('Error deleting transaction:', error.message);
        alert(`Erro ao excluir do banco: ${error.message}`);
        loadTransactions(); // Revert to server state if delete failed
      }
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
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} user={user} isPro={isPro} />
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
