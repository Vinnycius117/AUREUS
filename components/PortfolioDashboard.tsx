
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

const CDI_MONTHLY = 0.009; // ~11.25% ao ano / 12

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

        // Monthly income/expense
        const now = new Date();
        const thisMonth = transactions.filter(t => {
            const d = new Date(t.timestamp);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const monthlyExpenses = Math.abs(thisMonth.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
        const monthlyIncome = thisMonth.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

        return {
            totalPatrimony, invested, liquid, investedPercent, liquidPercent,
            byCategory, monthlyExpenses, monthlyIncome, savingsRate,
        };
    }, [assets, transactions]);

    // ── Insights Engine ─────────────────────────────────────────────────
    const insights = useMemo(() => {
        const list: { icon: string; color: string; title: string; text: string; category: 'Indicação' | 'Análise' | 'Dica' }[] = [];

        // 1. Opportunity Cost (Analysis)
        if (metrics.liquid > 1000) {
            const potentialGain = metrics.liquid * CDI_MONTHLY;
            list.push({
                category: 'Análise',
                icon: 'monetization_on',
                color: 'text-amber-400',
                title: 'Liquidez Ociosa',
                text: `Seus ${formatCurrency(metrics.liquid)} parados poderiam render até ${formatCurrency(potentialGain)} mensais em um CDB de 100% do CDI.`,
            });
        }

        // 2. Diversification (Indication)
        const categoriesCount = Object.keys(metrics.byCategory).length;
        if (metrics.totalPatrimony > 0 && categoriesCount < 3) {
            list.push({
                category: 'Indicação',
                icon: 'grid_view',
                color: 'text-sky-400',
                title: 'Baixa Diversificação',
                text: 'Sua carteira está concentrada em poucas categorias. Considere explorar Fundos Imobiliários ou Ações Internacionais para reduzir riscos.',
            });
        }

        // 3. Specific Rebalancing (Indication)
        assets.forEach(a => {
            if (a.target_percent > 0 && metrics.totalPatrimony > 0) {
                const actual = (Number(a.current_value) / metrics.totalPatrimony) * 100;
                const diff = actual - a.target_percent;
                if (Math.abs(diff) > 10) {
                    list.push({
                        category: 'Indicação',
                        icon: 'sync_alt',
                        color: diff > 0 ? 'text-rose-400' : 'text-primary',
                        title: `Ajuste: ${a.name}`,
                        text: diff > 0
                            ? `${a.name} excedeu a meta em ${diff.toFixed(0)}%. Rebalanceie para proteger seus lucros.`
                            : `${a.name} está ${Math.abs(diff).toFixed(0)}% abaixo da meta. Ótimo momento para aportar.`,
                    });
                }
            }
        });

        return list;
    }, [metrics, assets]);

    // ── Donut Chart View ────────────────────────────────────────────────
    const DonutChart = () => {
        const entries = Object.entries(metrics.byCategory).filter(([, v]) => v > 0);
        if (entries.length === 0) return (
            <div className="w-44 h-44 rounded-full border-[10px] border-charcoal/20 flex flex-col items-center justify-center mx-auto opacity-50">
                <span className="material-symbols-outlined text-3xl mb-1">donut_large</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Sem Ativos</span>
            </div>
        );

        const radius = 60;
        const circumference = 2 * Math.PI * radius;
        let cumulative = 0;

        return (
            <div className="relative mx-auto" style={{ width: 176, height: 176 }}>
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                    {entries.map(([cat, value], i) => {
                        const percent = value / metrics.totalPatrimony;
                        const dashArray = `${circumference * percent} ${circumference * (1 - percent)}`;
                        const dashOffset = -circumference * cumulative;
                        cumulative += percent;
                        const config = CATEGORY_CONFIG[cat as AssetCategory] || CATEGORY_CONFIG['Outros'];
                        return (
                            <circle key={i} cx="80" cy="80" r={radius} fill="none" stroke={config.color} strokeWidth="14"
                                strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-lg font-black text-white leading-tight">
                        {metrics.totalPatrimony > 1000000 ? (metrics.totalPatrimony / 1000000).toFixed(1) + 'M' : formatCurrency(metrics.totalPatrimony)}
                    </span>
                    <span className="text-[7px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 whitespace-nowrap">Patrimônio Global</span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-background-dark overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar scroll-smooth">
                <Header title="Carteira" subtitle="Gestão Patrimonial Inteligente" />

                <div className="p-8 pb-3 flex items-center justify-between sticky top-20 bg-background-dark z-20">
                    <div className="flex items-center gap-2 bg-card-dark/30 p-1 rounded-xl border border-charcoal/40">
                        {(['overview', 'goals'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-background-dark shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                                {tab === 'overview' ? 'RESUMO' : 'OBJETIVOS'}
                            </button>
                        ))}
                    </div>
                    {activeTab === 'overview' && (
                        <button onClick={onAddAsset} className="flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]">
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                            NOVO ATIVO
                        </button>
                    )}
                </div>

                {activeTab === 'overview' ? (
                    <div className="p-8 pt-4 space-y-6">
                        {/* Summary Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#151515] border border-white/[0.03] rounded-3xl p-6 relative overflow-hidden group">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Patrimônio Global</span>
                                <p className="text-3xl font-black text-white tracking-tight tabular-nums">{formatCurrency(metrics.totalPatrimony)}</p>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="bg-[#151515] border border-white/[0.03] rounded-3xl p-6 relative">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Total Investido</span>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-3xl font-black text-emerald-400 tracking-tight tabular-nums">{formatCurrency(metrics.invested)}</p>
                                    <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">{metrics.investedPercent.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="bg-[#151515] border border-white/[0.03] rounded-3xl p-6 relative">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Em Liquidez (Reserva)</span>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-3xl font-black text-sky-400 tracking-tight tabular-nums">{formatCurrency(metrics.liquid)}</p>
                                    <span className="text-[10px] font-black text-sky-500/40 uppercase tracking-widest">{metrics.liquidPercent.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Allocation Area */}
                            <div className="bg-[#151515]/40 border border-white/[0.02] rounded-[2.5rem] p-10 flex flex-col items-center">
                                <div className="w-full mb-10 text-center">
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Alocação de Carteira</h3>
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mt-2">Distribuição por Risco e Ativo</p>
                                </div>
                                <DonutChart />
                                <div className="mt-12 grid grid-cols-2 gap-x-12 gap-y-6 w-full max-w-sm">
                                    {Object.entries(metrics.byCategory).filter(([, v]) => v > 0).map(([cat, value]) => {
                                        const config = CATEGORY_CONFIG[cat as AssetCategory] || CATEGORY_CONFIG['Outros'];
                                        return (
                                            <div key={cat} className="flex items-center gap-3">
                                                <div className="w-1 h-3 rounded-full" style={{ backgroundColor: config.color }}></div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5 whitespace-nowrap">{cat}</p>
                                                    <p className="text-[11px] font-bold text-slate-600 tabular-nums">{(value / metrics.totalPatrimony * 100).toFixed(1)}%</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Assets Mini-List */}
                            <div className="bg-[#151515]/40 border border-white/[0.02] rounded-[2.5rem] p-8">
                                <div className="mb-8">
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Meus Ativos</h3>
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mt-2">Ativos Consolidados no AUREUS</p>
                                </div>
                                <div className="space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar pr-3 text-white/90">
                                    {assets.length === 0 ? (
                                        <div className="text-center py-20 opacity-20">
                                            <span className="material-symbols-outlined text-6xl mb-4">account_balance_wallet</span>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sem ativos registrados</p>
                                        </div>
                                    ) : assets.map(asset => {
                                        const config = CATEGORY_CONFIG[asset.category] || CATEGORY_CONFIG['Outros'];
                                        return (
                                            <div key={asset.id} className="flex items-center gap-4 bg-white/[0.01] hover:bg-white/[0.03] p-4 rounded-2xl border border-white/[0.03] transition-all group">
                                                <div className="w-10 h-10 rounded-xl bg-charcoal/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    <span className="material-symbols-outlined text-xl" style={{ color: config.color }}>{config.icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis">{asset.name}</p>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mt-1 flex items-center gap-2">
                                                        {asset.category} <span className="w-1 h-1 rounded-full bg-charcoal"></span>
                                                        <span className={asset.status === 'invested' ? 'text-emerald-500' : 'text-sky-400'}>{asset.status === 'invested' ? 'INVESTIDO' : 'LIQUIDEZ'}</span>
                                                    </p>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <p className="text-sm font-black text-white tabular-nums">{formatCurrency(Number(asset.current_value))}</p>
                                                    <button onClick={() => onDeleteAsset(asset.id)} className="opacity-0 group-hover:opacity-100 transition-all text-rose-500 hover:text-rose-400 mt-1">
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Insights Area ────────────────────────────────── */}
                        <div className="bg-[#151515] border border-white/[0.03] rounded-[2.5rem] p-10 relative overflow-hidden">
                            <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                                <div className="lg:w-1/3">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                            <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-widest">Aureus Insights</h3>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-bold">
                                        Monitoramento inteligente focado em custo de oportunidade, diversificação e equilíbrio de risco da sua carteira.
                                    </p>
                                </div>

                                <div className="flex-1 space-y-4">
                                    {insights.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                                            <span className="material-symbols-outlined text-5xl mb-3">analytics</span>
                                            <p className="text-[10px] font-black uppercase tracking-widest">Aguardando dados de ativos</p>
                                        </div>
                                    ) : insights.map((insight, i) => (
                                        <div key={i} className="flex items-start gap-5 bg-white/[0.02] border border-white/[0.03] p-6 rounded-3xl hover:bg-white/[0.04] transition-all group">
                                            <div className="w-10 h-10 rounded-xl bg-charcoal/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                <span className={`material-symbols-outlined text-xl ${insight.color}`}>{insight.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <span className={`text-[8px] font-black uppercase tracking-[2px] px-2 py-0.5 rounded-full border border-white/5 ${insight.color} bg-white/[0.02]`}>{insight.category}</span>
                                                    <p className="text-[12px] font-black text-white uppercase tracking-widest">{insight.title}</p>
                                                </div>
                                                <p className="text-[11px] text-slate-400 leading-relaxed font-bold">{insight.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Goals View ────────────────────────────────────────── */
                    <div className="p-8 pt-4 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Objetivos Ativos</h3>
                            <button onClick={onAddGoal} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-background-dark font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]">
                                DEFINIR META
                            </button>
                        </div>
                        {goals.length === 0 ? (
                            <div className="text-center py-32 opacity-20">
                                <span className="material-symbols-outlined text-7xl mb-4">flag</span>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Qual o seu próximo objetivo?</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {goals.map(goal => {
                                    const progress = goal.target_amount > 0 ? (Number(goal.current_amount) / Number(goal.target_amount)) * 100 : 0;
                                    const remains = Number(goal.target_amount) - Number(goal.current_amount);
                                    return (
                                        <div key={goal.id} className="bg-[#151515] border border-white/[0.03] rounded-3xl p-8 group relative overflow-hidden">
                                            <div className="flex items-start justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                        <span className="material-symbols-outlined text-2xl text-primary">{goal.icon || 'flag'}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-white uppercase tracking-widest leading-none">{goal.name}</p>
                                                        {goal.deadline && <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">META PARA {new Date(goal.deadline).toLocaleDateString()}</p>}
                                                    </div>
                                                </div>
                                                <button onClick={() => onDeleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 transition-all text-rose-500"><span className="material-symbols-outlined text-sm">delete</span></button>
                                            </div>
                                            <div className="mb-6">
                                                <div className="flex justify-between items-end mb-2.5">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reserva Acumulada</span>
                                                    <span className="text-xl font-black text-primary tabular-nums">{progress.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-2 bg-charcoal/40 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                                                <span className="text-slate-600">FALTAM {formatCurrency(remains > 0 ? remains : 0)}</span>
                                                <span className="text-white">{formatCurrency(Number(goal.target_amount))}</span>
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
