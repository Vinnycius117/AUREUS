
import React, { useState, useMemo } from 'react';
import Header from './Header';
import { PortfolioAsset, Goal, Transaction, AssetCategory } from '../types';

interface PortfolioDashboardProps {
    assets: PortfolioAsset[];
    goals: Goal[];
    transactions: Transaction[];
    onAddAsset: () => void;
    onAddGoal: () => void;
    onDeleteAsset: (id: string) => void;
    onDeleteGoal: (id: string) => void;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const CATEGORY_CONFIG: Record<AssetCategory, { color: string; icon: string }> = {
    'Ações': { color: '#6366f1', icon: 'trending_up' },
    'Renda Fixa': { color: '#22c55e', icon: 'lock' },
    'FIIs': { color: '#f59e0b', icon: 'apartment' },
    'Cripto': { color: '#8b5cf6', icon: 'currency_bitcoin' },
    'Stocks': { color: '#06b6d4', icon: 'public' },
    'Outros': { color: '#64748b', icon: 'more_horiz' },
};

const CDI_MONTHLY = 0.009; // ~13.15% ao ano / 12

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({
    assets, goals, transactions, onAddAsset, onAddGoal, onDeleteAsset, onDeleteGoal,
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'goals'>('overview');

    // ── Core Metrics ────────────────────────────────────────────────────
    const metrics = useMemo(() => {
        const totalPatrimony = assets.reduce((s, a) => s + Number(a.current_value), 0);
        const invested = assets.filter(a => a.status === 'invested').reduce((s, a) => s + Number(a.current_value), 0);
        const liquid = assets.filter(a => a.status === 'liquid').reduce((s, a) => s + Number(a.current_value), 0);
        const investedPercent = totalPatrimony > 0 ? (invested / totalPatrimony) * 100 : 0;
        const liquidPercent = totalPatrimony > 0 ? (liquid / totalPatrimony) * 100 : 0;

        // Category breakdown
        const byCategory: Record<string, number> = {};
        assets.forEach(a => {
            byCategory[a.category] = (byCategory[a.category] || 0) + Number(a.current_value);
        });

        // Monthly expenses from transactions
        const now = new Date();
        const thisMonth = transactions.filter(t => {
            const d = new Date(t.timestamp);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.amount < 0;
        });
        const monthlyExpenses = Math.abs(thisMonth.reduce((s, t) => s + t.amount, 0));
        const monthlyIncome = transactions.filter(t => {
            const d = new Date(t.timestamp);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.amount > 0;
        }).reduce((s, t) => s + t.amount, 0);

        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

        return {
            totalPatrimony, invested, liquid, investedPercent, liquidPercent,
            byCategory, monthlyExpenses, monthlyIncome, savingsRate,
        };
    }, [assets, transactions]);

    // ── Insights Engine ─────────────────────────────────────────────────
    const insights = useMemo(() => {
        const list: { icon: string; color: string; title: string; text: string }[] = [];

        // 1. Opportunity Cost
        if (metrics.liquid > 500) {
            const potentialGain = metrics.liquid * CDI_MONTHLY;
            list.push({
                icon: 'lightbulb',
                color: 'text-amber-400',
                title: 'Custo de Oportunidade',
                text: `Você tem ${formatCurrency(metrics.liquid)} parados. Se investisse em 100% do CDI, renderia aproximadamente ${formatCurrency(potentialGain)} por mês.`,
            });
        }

        // 2. Savings Rate
        if (metrics.monthlyIncome > 0) {
            if (metrics.savingsRate < 20) {
                list.push({
                    icon: 'warning',
                    color: 'text-rose-400',
                    title: 'Taxa de Poupança Baixa',
                    text: `Sua taxa de poupança este mês é de ${metrics.savingsRate.toFixed(0)}%. Especialistas recomendam no mínimo 20%. Analise suas despesas para encontrar oportunidades de economia.`,
                });
            } else if (metrics.savingsRate >= 50) {
                list.push({
                    icon: 'emoji_events',
                    color: 'text-emerald-400',
                    title: 'Excelente Disciplina!',
                    text: `Sua taxa de poupança este mês é de ${metrics.savingsRate.toFixed(0)}%. Parabéns! Você está no caminho certo para a independência financeira.`,
                });
            }
        }

        // 3. Rebalancing check
        assets.forEach(a => {
            if (a.target_percent > 0 && metrics.totalPatrimony > 0) {
                const actual = (Number(a.current_value) / metrics.totalPatrimony) * 100;
                const diff = actual - a.target_percent;
                if (Math.abs(diff) > 10) {
                    list.push({
                        icon: 'balance',
                        color: diff > 0 ? 'text-amber-400' : 'text-sky-400',
                        title: `Rebalancear: ${a.name}`,
                        text: diff > 0
                            ? `${a.name} está ${diff.toFixed(0)}% acima da meta de ${a.target_percent}%. Considere vender parte para equilibrar.`
                            : `${a.name} está ${Math.abs(diff).toFixed(0)}% abaixo da meta de ${a.target_percent}%. Considere aportar mais.`,
                    });
                }
            }
        });

        // 4. Goal progress
        goals.forEach(g => {
            const progress = g.target_amount > 0 ? (Number(g.current_amount) / Number(g.target_amount)) * 100 : 0;
            if (progress >= 90 && progress < 100) {
                list.push({
                    icon: 'flag',
                    color: 'text-emerald-400',
                    title: `Quase lá: ${g.name}`,
                    text: `Faltam apenas ${formatCurrency(Number(g.target_amount) - Number(g.current_amount))} para atingir sua meta "${g.name}"! Continue assim!`,
                });
            }
        });

        // 5. No investments
        if (assets.length === 0) {
            list.push({
                icon: 'rocket_launch',
                color: 'text-primary',
                title: 'Comece a investir',
                text: 'Adicione seus ativos e investimentos para receber insights personalizados sobre sua saúde financeira.',
            });
        }

        return list;
    }, [metrics, assets, goals]);

    // ── Donut Chart SVG ─────────────────────────────────────────────────
    const DonutChart = () => {
        const entries = Object.entries(metrics.byCategory).filter(([, v]) => v > 0);
        if (entries.length === 0) {
            return (
                <div className="w-48 h-48 rounded-full border-[12px] border-charcoal/50 flex items-center justify-center mx-auto">
                    <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Sem Dados</span>
                </div>
            );
        }

        const total = entries.reduce((s, [, v]) => s + v, 0);
        let cumulative = 0;
        const radius = 60;
        const circumference = 2 * Math.PI * radius;

        return (
            <div className="relative mx-auto" style={{ width: 192, height: 192 }}>
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                    {entries.map(([cat, value], i) => {
                        const percent = value / total;
                        const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
                        const strokeDashoffset = -circumference * cumulative;
                        cumulative += percent;
                        const config = CATEGORY_CONFIG[cat as AssetCategory] || CATEGORY_CONFIG['Outros'];
                        return (
                            <circle
                                key={i}
                                cx="80" cy="80" r={radius}
                                fill="none"
                                stroke={config.color}
                                strokeWidth="16"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className="transition-all duration-700"
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{formatCurrency(total)}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Patrimônio</span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-background-dark overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar scroll-smooth">
                <Header title="Carteira" subtitle="Gestão Patrimonial Avançada" />

                {/* Tab Switcher */}
                <div className="px-8 pt-6 pb-2 sticky top-20 bg-background-dark z-10">
                    <div className="flex items-center gap-2 bg-card-dark/50 p-1.5 rounded-2xl border border-charcoal/50 w-fit">
                        {(['overview', 'goals'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab
                                        ? 'bg-primary text-background-dark shadow-lg shadow-primary/20'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {tab === 'overview' ? 'Visão Geral' : 'Metas'}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'overview' ? (
                    <div className="p-8 space-y-8">
                        {/* ── Overview Cards ──────────────────────────────── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Total Patrimony */}
                            <div className="bg-card-dark/60 border border-charcoal/50 rounded-[2rem] p-8 relative overflow-hidden group hover:border-primary/30 transition-all">
                                <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-all"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                            <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Patrimônio Total</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white tabular-nums">{formatCurrency(metrics.totalPatrimony)}</p>
                                </div>
                            </div>

                            {/* Invested */}
                            <div className="bg-card-dark/60 border border-charcoal/50 rounded-[2rem] p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                                <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/5 rounded-full blur-[60px] group-hover:bg-emerald-500/10 transition-all"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                            <span className="material-symbols-outlined text-emerald-500 text-xl">trending_up</span>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Investido</span>
                                    </div>
                                    <p className="text-3xl font-bold text-emerald-400 tabular-nums">{formatCurrency(metrics.invested)}</p>
                                    <p className="text-xs text-slate-600 mt-2 font-bold">{metrics.investedPercent.toFixed(0)}% do patrimônio</p>
                                </div>
                            </div>

                            {/* Liquid */}
                            <div className="bg-card-dark/60 border border-charcoal/50 rounded-[2rem] p-8 relative overflow-hidden group hover:border-sky-500/30 transition-all">
                                <div className="absolute -top-16 -right-16 w-32 h-32 bg-sky-500/5 rounded-full blur-[60px] group-hover:bg-sky-500/10 transition-all"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20">
                                            <span className="material-symbols-outlined text-sky-500 text-xl">water_drop</span>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Liquidez (Parado)</span>
                                    </div>
                                    <p className="text-3xl font-bold text-sky-400 tabular-nums">{formatCurrency(metrics.liquid)}</p>
                                    <p className="text-xs text-slate-600 mt-2 font-bold">{metrics.liquidPercent.toFixed(0)}% do patrimônio</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Allocation Chart + Assets List ──────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Donut */}
                            <div className="bg-card-dark/60 border border-charcoal/50 rounded-[2rem] p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-tight">Alocação de Ativos</h3>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-1">Distribuição por Categoria</p>
                                    </div>
                                </div>
                                <DonutChart />
                                {/* Legend */}
                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    {Object.entries(metrics.byCategory).filter(([, v]) => v > 0).map(([cat, value]) => {
                                        const config = CATEGORY_CONFIG[cat as AssetCategory] || CATEGORY_CONFIG['Outros'];
                                        const percent = metrics.totalPatrimony > 0 ? (value / metrics.totalPatrimony * 100).toFixed(0) : '0';
                                        return (
                                            <div key={cat} className="flex items-center gap-3 bg-white/[0.02] px-4 py-3 rounded-xl">
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }}></span>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-300 truncate">{cat}</p>
                                                    <p className="text-[10px] text-slate-600 font-bold">{percent}% — {formatCurrency(value)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Assets List */}
                            <div className="bg-card-dark/60 border border-charcoal/50 rounded-[2rem] p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-tight">Meus Ativos</h3>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-1">Investimentos e Reservas</p>
                                    </div>
                                    <button
                                        onClick={onAddAsset}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-background-dark font-black rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all active:scale-[0.97] shadow-lg shadow-primary/20"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        Adicionar
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-2">
                                    {assets.length === 0 ? (
                                        <div className="text-center py-16 opacity-40">
                                            <span className="material-symbols-outlined text-5xl text-primary/40 mb-4 block">account_balance</span>
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Nenhum ativo cadastrado</p>
                                        </div>
                                    ) : assets.map(asset => {
                                        const config = CATEGORY_CONFIG[asset.category] || CATEGORY_CONFIG['Outros'];
                                        return (
                                            <div key={asset.id} className="flex items-center gap-4 bg-white/[0.02] hover:bg-white/[0.05] p-4 rounded-2xl transition-all group border border-transparent hover:border-white/5">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: config.color + '15', borderColor: config.color + '30' }}>
                                                    <span className="material-symbols-outlined text-xl" style={{ color: config.color }}>{config.icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-200 text-sm truncate">{asset.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{asset.category}</span>
                                                        <span className="w-1 h-1 rounded-full bg-charcoal"></span>
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${asset.status === 'invested' ? 'text-emerald-500' : 'text-sky-400'}`}>
                                                            {asset.status === 'invested' ? 'Investido' : 'Parado'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-white text-sm tabular-nums">{formatCurrency(Number(asset.current_value))}</p>
                                                <button
                                                    onClick={() => onDeleteAsset(asset.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-all p-2 text-rose-500/50 hover:text-rose-500 rounded-full"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Aureus Insights ─────────────────────────────── */}
                        <div className="bg-card-dark/60 border border-charcoal/50 rounded-[2rem] p-8 relative overflow-hidden">
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                        <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-tight">Aureus Insights</h3>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-0.5">Análise Inteligente do Patrimônio</p>
                                    </div>
                                </div>

                                {insights.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">Adicione seus ativos e metas para receber recomendações personalizadas.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {insights.map((insight, i) => (
                                            <div key={i} className="flex items-start gap-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                                                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className={`material-symbols-outlined text-lg ${insight.color}`}>{insight.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white mb-1">{insight.title}</p>
                                                    <p className="text-xs text-slate-400 leading-relaxed">{insight.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Goals Tab ──────────────────────────────────────── */
                    <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Minhas Metas Financeiras</h3>
                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-1">Acompanhe o progresso dos seus objetivos</p>
                            </div>
                            <button
                                onClick={onAddGoal}
                                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-background-dark font-black rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all active:scale-[0.97] shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Nova Meta
                            </button>
                        </div>

                        {goals.length === 0 ? (
                            <div className="text-center py-24 opacity-40">
                                <div className="w-20 h-20 bg-charcoal/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-5xl text-primary/40">flag</span>
                                </div>
                                <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Nenhuma meta definida</p>
                                <p className="text-xs text-slate-600 mt-3">Defina seus objetivos financeiros para receber insights personalizados.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {goals.map(goal => {
                                    const progress = goal.target_amount > 0 ? (Number(goal.current_amount) / Number(goal.target_amount)) * 100 : 0;
                                    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
                                    const isComplete = progress >= 100;

                                    return (
                                        <div key={goal.id} className={`bg-card-dark/60 border rounded-[2rem] p-8 relative overflow-hidden group transition-all hover:shadow-xl ${isComplete ? 'border-emerald-500/30' : 'border-charcoal/50 hover:border-primary/30'}`}>
                                            <div className={`absolute -top-16 -right-16 w-32 h-32 rounded-full blur-[60px] ${isComplete ? 'bg-emerald-500/10' : 'bg-primary/5'}`}></div>

                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isComplete ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-primary/10 border-primary/20'}`}>
                                                            <span className={`material-symbols-outlined text-2xl ${isComplete ? 'text-emerald-500' : 'text-primary'}`}>
                                                                {goal.icon || 'flag'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-lg">{goal.name}</p>
                                                            {goal.deadline && (
                                                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                                                                    Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => onDeleteGoal(goal.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-all p-2 text-rose-500/50 hover:text-rose-500 rounded-full"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mb-4">
                                                    <div className="h-3 bg-charcoal/50 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary to-primary/70'}`}
                                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <p className="text-xs text-slate-500 font-bold">{formatCurrency(Number(goal.current_amount))}</p>
                                                        <p className="text-[10px] text-slate-600">de {formatCurrency(Number(goal.target_amount))}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-2xl font-bold tabular-nums ${isComplete ? 'text-emerald-400' : 'text-primary'}`}>
                                                            {progress.toFixed(0)}%
                                                        </p>
                                                        {!isComplete && (
                                                            <p className="text-[10px] text-slate-600 font-bold">Faltam {formatCurrency(remaining)}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioDashboard;
