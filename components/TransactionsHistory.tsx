
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './Header';
import { Transaction } from '../types';

interface TransactionsHistoryProps {
  transactions: Transaction[];
  onOpenModal: () => void;
  onDeleteTransaction: (id: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const TransactionsHistory: React.FC<TransactionsHistoryProps> = ({ transactions, onOpenModal, onDeleteTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' | 'YYYY-MM'
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build unique month options from transaction data
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(tx => {
      if (tx.timestamp) {
        const d = new Date(tx.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.add(key);
      }
    });
    return Array.from(months)
      .sort((a, b) => b.localeCompare(a)) // newest first
      .map(key => {
        const [year, month] = key.split('-');
        return { value: key, label: `${MONTH_NAMES[parseInt(month) - 1]} ${year}` };
      });
  }, [transactions]);

  const currentLabel = useMemo(() => {
    if (selectedMonth === 'all') return 'TODOS OS MESES';
    const opt = monthOptions.find(o => o.value === selectedMonth);
    return opt ? opt.label.toUpperCase() : 'TODOS OS MESES';
  }, [selectedMonth, monthOptions]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by month
    if (selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-').map(Number);
      filtered = filtered.filter(tx => {
        if (!tx.timestamp) return false;
        const d = new Date(tx.timestamp);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.details.toLowerCase().includes(lower) ||
        (tx.reference && tx.reference.toLowerCase().includes(lower))
      );
    }

    return filtered;
  }, [transactions, selectedMonth, searchTerm]);

  // Summary for selected period
  const periodSummary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
    const expenses = Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0));
    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background-dark overflow-hidden">
      <div className="flex-1 overflow-auto custom-scrollbar scroll-smooth">
        <Header title="Histórico de Lançamentos" subtitle="Livro Caixa Detalhado" />

        <section className="px-8 py-6 border-b border-charcoal/50 flex flex-col lg:flex-row lg:items-center gap-6 bg-background-dark/80 backdrop-blur-md sticky top-20 z-10 shadow-sm">
          <div className="relative flex-1 max-w-lg">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary transition-colors">search</span>
            <input
              className="w-full bg-card-dark/50 border border-charcoal rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-inner"
              placeholder="Pesquisar por descrição ou ID..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Elegant Custom Month Filter Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className={`flex items-center gap-3 px-5 py-3.5 bg-card-dark border ${isMonthDropdownOpen ? 'border-primary/50 ring-2 ring-primary/10' : 'border-charcoal'} rounded-2xl transition-all hover:bg-white/5 active:scale-[0.98] min-w-[200px] group`}
              >
                <span className={`material-symbols-outlined text-sm ${isMonthDropdownOpen ? 'text-primary' : 'text-slate-500'} group-hover:text-primary transition-colors`}>calendar_month</span>
                <span className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-300 text-left">
                  {currentLabel}
                </span>
                <span className={`material-symbols-outlined text-sm text-slate-500 transition-transform duration-300 ${isMonthDropdownOpen ? 'rotate-180 text-primary' : ''}`}>expand_more</span>
              </button>

              {/* Dropdown Menu */}
              {isMonthDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar py-2">
                    <button
                      onClick={() => {
                        setSelectedMonth('all');
                        setIsMonthDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/5 ${selectedMonth === 'all' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-sm opacity-60">all_inclusive</span>
                      Todos os meses
                    </button>
                    {monthOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSelectedMonth(opt.value);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/5 ${selectedMonth === opt.value ? 'text-primary bg-primary/5' : 'text-slate-400'}`}
                      >
                        <span className="material-symbols-outlined text-sm opacity-60">calendar_today</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onOpenModal}
              className="flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary/90 text-background-dark font-black rounded-2xl transition-all shadow-xl shadow-primary/20 text-[10px] uppercase tracking-[0.2em] active:scale-[0.98] transform hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Novo Lançamento
            </button>
          </div>
        </section>

        {/* Period Summary Bar - Redesigned for Elegance */}
        {selectedMonth !== 'all' && (
          <div className="px-8 py-5 bg-gradient-to-r from-card-dark/40 to-transparent border-b border-charcoal/30 flex flex-wrap items-center gap-x-12 gap-y-4 animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Receitas do Período</p>
                <p className="text-base font-bold text-emerald-400 tabular-nums">{formatCurrency(periodSummary.income)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <span className="material-symbols-outlined text-rose-500 text-sm">trending_down</span>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Despesas do Período</p>
                <p className="text-base font-bold text-rose-400 tabular-nums">{formatCurrency(periodSummary.expenses)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto border-l border-charcoal/50 pl-12">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${periodSummary.balance >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                <span className={`material-symbols-outlined text-xl ${periodSummary.balance >= 0 ? 'text-primary' : 'text-rose-400'}`}>
                  {periodSummary.balance >= 0 ? 'account_balance_wallet' : 'warning'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Saldo Consolidado</p>
                <p className={`text-xl font-bold tabular-nums ${periodSummary.balance >= 0 ? 'text-primary' : 'text-rose-400'}`}>
                  {formatCurrency(periodSummary.balance)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-8">
          <div className="bg-card-dark/40 rounded-[2rem] border border-charcoal/50 overflow-hidden shadow-2xl backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-charcoal/20 border-b border-charcoal/50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Detalhes da Operação</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Data</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right pr-20">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/30 text-sm">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.03] transition-all group relative">
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:shadow-2xl group-hover:scale-110 ${tx.amount > 0 ? 'bg-primary/10 border border-primary/20' : 'bg-charcoal/40 border border-white/5'}`}>
                          <span className={`material-symbols-outlined text-3xl ${tx.amount > 0 ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'}`}>
                            {tx.amount > 0 ? 'add_chart' : 'payments'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 group-hover:text-primary transition-colors text-lg tracking-tight leading-tight">{tx.details}</p>
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.15em] mt-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-charcoal"></span>
                            {tx.reference || `#LANC-${tx.id.slice(0, 4)}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 text-slate-400 font-bold text-center text-xs tracking-wider">
                      {tx.date.toUpperCase()}
                    </td>
                    <td className={`px-8 py-7 text-right font-bold tabular-nums text-lg relative pr-20 ${tx.amount > 0 ? 'text-emerald-500' : 'text-slate-100'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTransaction(tx.id);
                        }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-2.5 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-full bg-white/5"
                        title="Remover Lançamento"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <div className="w-20 h-20 bg-charcoal/30 rounded-full flex items-center justify-center mb-6">
                          <span className="material-symbols-outlined text-5xl text-primary/40">inventory_2</span>
                        </div>
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Nenhum registro</p>
                        <p className="text-xs text-slate-600 mt-3 font-medium max-w-xs mx-auto leading-relaxed">Não encontramos transações para o filtro selecionado. Tente trocar o mês ou buscar por outro termo.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-10 flex justify-between items-center px-6">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-px bg-charcoal"></span>
              Mostrando {filteredTransactions.length} de {transactions.length} registros
            </p>
            <div className="flex gap-3">
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-charcoal/30 text-slate-600 cursor-not-allowed border border-white/5 transition-all">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-charcoal hover:bg-white/10 text-white border border-white/10 transition-all hover:border-primary/50 group">
                <span className="material-symbols-outlined text-sm group-hover:text-primary">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsHistory;
