
import React, { useState, useMemo } from 'react';
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

        <section className="px-8 py-6 border-b border-charcoal flex flex-col md:flex-row md:items-center gap-4 bg-background-dark sticky top-20 z-10 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
            <input
              className="w-full bg-card-dark border border-charcoal rounded-xl py-3 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner"
              placeholder="Pesquisar por descrição ou ID..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Month Filter */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-sm pointer-events-none">calendar_month</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-card-dark border border-charcoal rounded-xl py-3 pl-10 pr-10 text-xs font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-white/20 [color-scheme:dark]"
              >
                <option value="all">Todos os meses</option>
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">expand_more</span>
            </div>

            <button
              onClick={onOpenModal}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all shadow-lg shadow-primary/20 text-xs font-bold uppercase tracking-widest active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Novo Lançamento
            </button>
          </div>
        </section>

        {/* Period Summary Bar */}
        {selectedMonth !== 'all' && (
          <div className="px-8 py-4 bg-card-dark/30 border-b border-charcoal/50 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Receitas:</span>
              <span className="text-sm font-bold text-emerald-400">{formatCurrency(periodSummary.income)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Despesas:</span>
              <span className="text-sm font-bold text-rose-400">{formatCurrency(periodSummary.expenses)}</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo:</span>
              <span className={`text-sm font-bold ${periodSummary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(periodSummary.balance)}
              </span>
            </div>
          </div>
        )}

        <div className="p-8">
          <div className="bg-card-dark/40 rounded-2xl border border-charcoal overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-charcoal/30 border-b border-charcoal/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Detalhes</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Data</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right pr-20">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/40 text-sm">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-all group relative">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:shadow-lg group-hover:scale-105 ${tx.amount > 0 ? 'bg-primary/10' : 'bg-charcoal/60'}`}>
                          <span className={`material-symbols-outlined text-2xl ${tx.amount > 0 ? 'text-primary' : 'text-primary/70'}`}>
                            {tx.amount > 0 ? 'add_chart' : 'payments'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 group-hover:text-primary transition-colors text-base tracking-tight">{tx.details}</p>
                          <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">{tx.reference || `#LANC-${tx.id.slice(0, 4)}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-400 font-medium text-center text-xs tracking-tight">
                      {tx.date}
                    </td>
                    <td className={`px-8 py-6 text-right font-black tabular-nums text-base relative pr-20 ${tx.amount > 0 ? 'text-emerald-500' : 'text-slate-100'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}

                      {/* Delete button positioned to match the screenshot layout */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTransaction(tx.id);
                        }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-2 text-rose-500 hover:bg-rose-500/10 rounded-full"
                        title="Remover Lançamento"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center opacity-30">
                        <span className="material-symbols-outlined text-6xl mb-4 text-primary">inventory_2</span>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Nenhum registro encontrado</p>
                        <p className="text-xs text-slate-600 mt-2 font-medium">Tente ajustar seus filtros ou adicione um novo lançamento.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-between items-center px-4">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
              Mostrando {filteredTransactions.length} de {transactions.length} registros
            </p>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-charcoal/50 text-slate-500 cursor-not-allowed border border-white/5">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="p-2 rounded-lg bg-charcoal hover:bg-charcoal/80 text-white border border-white/10 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsHistory;
