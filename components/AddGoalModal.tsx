
import React, { useState } from 'react';
import { Goal } from '../types';

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (goal: Goal) => void;
}

const GOAL_ICONS = [
    { value: 'flag', label: 'Meta' },
    { value: 'savings', label: 'Reserva' },
    { value: 'flight_takeoff', label: 'Viagem' },
    { value: 'home', label: 'Imóvel' },
    { value: 'directions_car', label: 'Veículo' },
    { value: 'school', label: 'Educação' },
    { value: 'diamond', label: 'Luxo' },
    { value: 'rocket_launch', label: 'Liberdade' },
];

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [icon, setIcon] = useState('flag');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const target = parseFloat(targetAmount.replace(',', '.'));
        const current = parseFloat(currentAmount.replace(',', '.')) || 0;
        if (isNaN(target) || target <= 0) return;

        const goal: Goal = {
            id: crypto.randomUUID(),
            name,
            target_amount: target,
            current_amount: current,
            deadline: deadline || undefined,
            icon,
        };

        onAdd(goal);
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
        setDeadline('');
        setIcon('flag');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#121212] border border-white/10 w-full max-w-lg rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden relative">
                {/* Ambient glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-20 bg-emerald-500"></div>

                <div className="p-8 pb-4 flex justify-between items-start relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Nova Meta</h2>
                        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Planejamento Financeiro</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-5 relative z-10">
                    {/* Icon selector */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Ícone</label>
                        <div className="grid grid-cols-4 gap-2">
                            {GOAL_ICONS.map(gi => (
                                <button
                                    key={gi.value}
                                    type="button"
                                    onClick={() => setIcon(gi.value)}
                                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${icon === gi.value
                                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                            : 'bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${icon === gi.value ? 'text-emerald-400' : 'text-slate-600'}`}>{gi.value}</span>
                                    {gi.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Nome da Meta</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors">edit</span>
                            <input
                                required autoFocus
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 placeholder:text-slate-700 transition-all"
                                placeholder="Ex: Reserva de Emergência, 1° Milhão..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Values */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Valor Alvo</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                                <input
                                    required type="text" inputMode="decimal"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 placeholder:text-slate-700 transition-all"
                                    placeholder="0,00"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9,.]/g, ''))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Já Acumulado</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                                <input
                                    type="text" inputMode="decimal"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 placeholder:text-slate-700 transition-all"
                                    placeholder="0,00"
                                    value={currentAmount}
                                    onChange={(e) => setCurrentAmount(e.target.value.replace(/[^0-9,.]/g, ''))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Prazo (Opcional)</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors text-lg">calendar_month</span>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined">flag</span>
                            Definir Meta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGoalModal;
