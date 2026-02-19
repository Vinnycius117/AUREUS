
import React, { useMemo, useState, useRef, useEffect } from 'react';
import Header from './Header';
import { EvolutionChart } from './Charts';
import { Transaction } from '../types';
import CountUp from './CountUp';
import { exportToPDF } from '../utils/exportReport';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  isPro?: boolean;
  onExport?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ transactions, onDeleteTransaction, isPro, onExport }) => {
  const stats = useMemo(() => {
    if (transactions.length === 0) {
      return {
        total: 0,
        income: 0,
        expenses: 0,
        history: [{ name: 'Início', value: 0, details: 'Saldo Inicial', change: 0 }],
        distribution: [],
        trends: { total: '0%', income: '0%', expenses: '0%', balance: '0%' }
      };
    }

    const sortedTx = [...transactions].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const total = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    const income = transactions.filter(t => t.amount > 0).reduce((acc, curr) => acc + curr.amount, 0);
    const expenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((acc, curr) => acc + curr.amount, 0));

    // Distribution for Pie Chart (kept in stats for metadata/PDF)
    const distribution = [
      { name: 'Entradas', value: income, color: '#c6a84e' },
      { name: 'Saídas', value: expenses, color: '#fb7185' }
    ].filter(item => item.value > 0);

    const lastTx = sortedTx[sortedTx.length - 1];
    const prevBalance = total - (lastTx?.amount || 0);

    const calculateTrend = (current: number, change: number) => {
      if (current === 0 || change === 0) return '0%';
      const percentage = ((Math.abs(change) / Math.abs(current)) * 100).toFixed(1);
      return `${change >= 0 ? '+' : '-'}${percentage}%`;
    };

    let runningBalance = 0;
    const dateCounts: Record<string, number> = {};
    const history = sortedTx.map((tx, index) => {
      runningBalance += tx.amount;
      const dateParts = tx.date.split(' ');
      const day = dateParts[0] || '';
      const month = (dateParts[2] || '').replace('.', '').toUpperCase();
      const dateLabel = `${day} ${month}`;

      dateCounts[dateLabel] = (dateCounts[dateLabel] || 0) + 1;
      const uniqueName = dateCounts[dateLabel] > 1 ? `${dateLabel} #${dateCounts[dateLabel]}` : dateLabel;
      return {
        name: uniqueName,
        value: runningBalance,
        details: tx.details,
        change: tx.amount,
        index: index + 1
      };
    });
    history.unshift({ name: 'Início', value: 0, details: 'Balanço Inicial', change: 0, index: 0 });

    return {
      total,
      income,
      expenses,
      history,
      distribution,
      trends: {
        total: calculateTrend(total, lastTx?.amount || 0),
        income: lastTx?.amount > 0 ? calculateTrend(income, lastTx.amount) : '0%',
        expenses: lastTx?.amount < 0 ? calculateTrend(expenses, lastTx.amount) : '0%',
        balance: calculateTrend(total, total - prevBalance)
      }
    };
  }, [transactions]);

  const chartRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!chartRef.current) return;

    // Feedback visual premium
    const notification = document.createElement('div');
    notification.id = 'export-notification';
    notification.innerHTML = `
      <div class="glass-notification">
        <div class="glow-effect"></div>
        <div class="content-wrapper">
          <div class="spinner-container">
            <span class="material-icons rotating">auto_awesome</span>
          </div>
          <div class="text-container">
            <p class="title">Gerando Relatório Aureus</p>
            <p class="subtitle">Processando inteligência e visuais...</p>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
      <style>
        @keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        
        #export-notification {
          position: fixed;
          top: 30px;
          right: 30px;
          z-index: 99999;
          font-family: 'Inter', sans-serif;
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .glass-notification {
          background: rgba(18, 18, 18, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(198, 168, 78, 0.3);
          border-radius: 16px;
          padding: 20px;
          width: 320px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(198, 168, 78, 0.05);
          position: relative;
          overflow: hidden;
        }

        .content-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          z-index: 10;
        }

        .rotating {
          animation: rotating 2s linear infinite;
          color: #c6a84e;
          font-size: 24px;
          text-shadow: 0 0 10px rgba(198, 168, 78, 0.5);
        }

        .title {
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .subtitle {
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          font-weight: 500;
          margin: 2px 0 0 0;
        }

        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: rgba(255,255,255,0.05);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #c6a84e, #8B7635);
          width: 0%;
          animation: progress 3s linear forwards;
        }

        .glow-effect {
          position: absolute;
          top: -50px;
          right: -50px;
          width: 100px;
          height: 100px;
          background: #c6a84e;
          filter: blur(50px);
          opacity: 0.15;
          pointer-events: none;
        }
      </style>
    `;
    document.body.appendChild(notification);

    try {
      await exportToPDF(chartRef.current, stats, transactions);
    } finally {
      setTimeout(() => {
        notification.style.transition = 'all 0.5s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(20px) scale(0.95)';
        setTimeout(() => notification.remove(), 500);
      }, 3500);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background-dark pb-12 custom-scrollbar scroll-smooth">
      <Header
        title="Resumo Patrimonial"
        subtitle="Sua Inteligência Financeira"
        onExport={onExport}
        isPro={isPro}
      />

      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Patrimônio Líquido"
            numericValue={stats.total}
            subtitle="Crescimento Total"
            variant="gold"
            icon="account_balance"
            trend={stats.trends.total}
          />
          <KPICard
            title="Entradas Totais"
            numericValue={stats.income}
            subtitle="Fluxo de Receita"
            variant="emerald"
            icon="trending_up"
            trend={stats.trends.income}
          />
          <KPICard
            title="Saídas Totais"
            numericValue={stats.expenses}
            subtitle="Controle de Gastos"
            variant="rose"
            icon="trending_down"
            trend={stats.trends.expenses}
          />
          <KPICard
            title="Saldo Disponível"
            numericValue={stats.total}
            subtitle="Liquidez Imediata"
            variant="glass"
            icon="wallet"
            trend={stats.trends.balance}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div ref={chartRef} className="bg-card-dark p-8 rounded-2xl border border-charcoal relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-primary/10"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Evolução do Patrimônio
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">Tempo Real</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Gráfico de performance considerando {transactions.length} lançamentos</p>
              </div>
              <div className="flex bg-charcoal/50 p-1 rounded-lg border border-white/5">
                <button className="px-4 py-1.5 text-[10px] font-bold text-white bg-primary rounded-md shadow-lg transition-all">Acumulado</button>
              </div>
            </div>

            {transactions.length > 0 ? (
              <EvolutionChart data={stats.history} />
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-charcoal rounded-xl bg-white/[0.01]">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <span className="material-icons text-primary text-3xl">insights</span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Aguardando lançamentos para análise de tendência</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card-dark rounded-2xl border border-charcoal overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-charcoal bg-charcoal/20 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white tracking-tight uppercase text-xs tracking-[0.2em]">Últimas Movimentações</h3>
            <span className="material-icons text-slate-500 text-sm cursor-pointer hover:text-white transition-colors">history</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-charcoal/40 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-charcoal">
                <tr>
                  <th className="px-8 py-5">Descrição</th>
                  <th className="px-8 py-5">Data</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                  <th className="px-8 py-5 w-20"></th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-300 divide-y divide-charcoal/50">
                {transactions.length > 0 ? (
                  transactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors group cursor-default">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full transition-all duration-700 group-hover:rotate-[360deg] ${tx.amount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                          <span className="font-semibold text-white group-hover:text-primary transition-colors">{tx.details}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-medium">{tx.date}</td>
                      <td className={`px-8 py-5 text-right font-bold tabular-nums ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-500 transition-all p-1"
                          title="Excluir Lançamento"
                        >
                          <span className="material-icons text-lg">delete_outline</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-600 font-medium italic">Sem movimentações recentes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface KPICardProps {
  title: string;
  numericValue: number;
  subtitle: string;
  variant: 'gold' | 'emerald' | 'rose' | 'glass';
  icon: string;
  trend?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, numericValue, subtitle, variant, icon, trend }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = {
    gold: 'border-primary/30 bg-gradient-to-br from-primary/10 to-transparent',
    emerald: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent',
    rose: 'border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent',
    glass: 'border-charcoal bg-charcoal/10 backdrop-blur-md'
  };

  const iconColors = {
    gold: 'text-primary bg-primary/10 shadow-[0_0_15px_rgba(198,168,78,0.1)]',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
    glass: 'text-slate-400 bg-charcoal'
  };

  const isTrendPositive = trend?.startsWith('+');

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-500 hover:scale-[1.02] group relative overflow-visible shadow-xl ${themes[variant]}`}>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity rounded-full ${variant === 'gold' ? 'bg-primary' : variant === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

      <div className="flex justify-between items-start relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ease-out group-hover:shadow-lg group-hover:rotate-[15deg] ${iconColors[variant]}`}>
          <span className="material-icons text-xl">{icon}</span>
        </div>

        <div className="flex items-center gap-2">
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter shadow-sm border ${isTrendPositive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
              <span className="material-icons text-[10px]">{isTrendPositive ? 'trending_up' : 'trending_down'}</span>
              {trend}
            </div>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`material-symbols-outlined text-slate-500 hover:text-primary transition-all text-xl cursor-pointer select-none p-1.5 rounded-full hover:bg-white/5 ${isMenuOpen ? 'text-primary bg-white/10 rotate-90 scale-110' : ''}`}
            >
              more_vert
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] py-2 z-[100] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-white/5 mb-1">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Configurações</p>
                </div>
                <button className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-primary/10 hover:text-white transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Ver Analítico
                </button>
                <button className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-primary/10 hover:text-white transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">share</span>
                  Exportar Dados
                </button>
                <button className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 transition-all flex items-center gap-2 border-t border-white/5 mt-1">
                  <span className="material-symbols-outlined text-sm">notifications</span>
                  Alertas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1 group-hover:text-slate-400 transition-colors">{title}</p>
        <CountUp
          from={0}
          to={numericValue}
          separator="."
          direction="up"
          duration={1.5}
          className="text-2xl font-bold text-white tracking-tight tabular-nums group-hover:text-primary transition-colors"
          startCounting={true}
          isCurrency={true}
        />
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-1.5 h-1.5 rounded-full ${variant === 'emerald' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : variant === 'rose' ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]' : 'bg-primary shadow-[0_0_5px_rgba(198,168,78,0.8)]'}`}></div>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
