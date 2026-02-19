
import React, { useState } from 'react';
import { PortfolioAsset, AssetCategory, AssetStatus } from '../types';

interface AddAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (asset: PortfolioAsset) => void;
}

const CATEGORIES: { value: AssetCategory; label: string; icon: string }[] = [
    { value: 'Ações', label: 'Ações', icon: 'trending_up' },
    { value: 'Renda Fixa', label: 'Renda Fixa', icon: 'lock' },
    { value: 'FIIs', label: 'Fundos Imobiliários', icon: 'apartment' },
    { value: 'Cripto', label: 'Criptomoedas', icon: 'currency_bitcoin' },
    { value: 'Stocks', label: 'Stocks (EUA)', icon: 'public' },
    { value: 'Outros', label: 'Outros', icon: 'more_horiz' },
];

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<AssetCategory>('Ações');
    const [status, setStatus] = useState<AssetStatus>('invested');
    const [value, setValue] = useState('');
    const [targetPercent, setTargetPercent] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numValue = parseFloat(value.replace(',', '.'));
        if (isNaN(numValue) || numValue <= 0) return;

        const asset: PortfolioAsset = {
            id: crypto.randomUUID(),
            name,
            category,
            status,
            current_value: numValue,
            target_percent: parseInt(targetPercent) || 0,
        };

        onAdd(asset);
        setName('');
        setValue('');
        setCategory('Ações');
        setStatus('invested');
        setTargetPercent('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#121212] border border-white/10 w-full max-w-lg rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden relative">
                {/* Ambient glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-20 bg-primary"></div>

                <div className="p-8 pb-4 flex justify-between items-start relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Adicionar Ativo</h2>
                        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Gestão Patrimonial</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-5 relative z-10">
                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Nome do Ativo</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors">account_balance</span>
                            <input
                                required autoFocus
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-slate-700 transition-all"
                                placeholder="Ex: PETR4, Tesouro Selic, Bitcoin..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Category Grid */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Categoria</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${category === cat.value
                                            ? 'bg-primary/15 border-primary/40 text-primary'
                                            : 'bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${category === cat.value ? 'text-primary' : 'text-slate-600'}`}>{cat.icon}</span>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Switcher */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Status do Dinheiro</label>
                        <div className="bg-white/[0.03] p-1.5 rounded-2xl flex border border-white/5">
                            <button
                                type="button"
                                onClick={() => setStatus('invested')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${status === 'invested'
                                        ? 'bg-emerald-500/15 text-emerald-400 shadow-xl ring-1 ring-emerald-500/30'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                Investido
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus('liquid')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${status === 'liquid'
                                        ? 'bg-sky-500/15 text-sky-400 shadow-xl ring-1 ring-sky-500/30'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">water_drop</span>
                                Parado
                            </button>
                        </div>
                    </div>

                    {/* Value + Target */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Valor Atual (BRL)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                                <input
                                    required type="text" inputMode="decimal"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-slate-700 transition-all"
                                    placeholder="0,00"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value.replace(/[^0-9,.]/g, ''))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Meta de Alocação (%)</label>
                            <div className="relative">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">%</span>
                                <input
                                    type="number" min="0" max="100"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-5 pr-10 text-white font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-slate-700 transition-all"
                                    placeholder="0"
                                    value={targetPercent}
                                    onChange={(e) => setTargetPercent(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-xs bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            Cadastrar Ativo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAssetModal;
