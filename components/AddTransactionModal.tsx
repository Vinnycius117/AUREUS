
import React, { useState } from 'react';
import { Transaction } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  if (!isOpen) return null;

  const setToday = () => {
    const now = new Date();
    setSelectedDate(now.toISOString().split('T')[0]);
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;

    const finalAmount = type === 'debit' ? -Math.abs(numAmount) : Math.abs(numAmount);

    // Parse the selected date
    const dateObj = new Date(selectedDate + 'T12:00:00'); // noon to avoid timezone issues
    const displayDate = dateObj.toLocaleDateString('pt-BR', { month: 'short', day: '2-digit', year: 'numeric' });

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      details,
      amount: finalAmount,
      account: 'Conta Principal',
      date: displayDate,
      timestamp: dateObj.getTime(),
      icon: type === 'credit' ? 'add_chart' : 'payments',
      type,
      reference: `#LANC-${Math.floor(Math.random() * 9000 + 1000)}`
    };

    onAdd(newTx);
    setDetails('');
    setAmount('');
    setType('debit');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all duration-300">
      <div
        className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative"
      >
        {/* Decorative ambient light */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-20 transition-colors duration-500 ${type === 'credit' ? 'bg-emerald-500' : 'bg-primary'}`}></div>

        <div className="p-8 pb-4 flex justify-between items-start relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Novo Lançamento</h2>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Gestão de Fluxo de Caixa</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-6 relative z-10">
          {/* Transaction Type Switcher */}
          <div className="bg-white/[0.03] p-1.5 rounded-2xl flex border border-white/5">
            <button
              type="button"
              onClick={() => setType('debit')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${type === 'debit'
                ? 'bg-[#2A2A2A] text-white shadow-xl ring-1 ring-white/10'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <span className={`material-symbols-outlined text-sm ${type === 'debit' ? 'text-rose-400' : ''}`}>trending_down</span>
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('credit')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${type === 'credit'
                ? 'bg-primary text-white shadow-xl shadow-primary/20'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <span className={`material-symbols-outlined text-sm ${type === 'credit' ? 'text-white' : ''}`}>trending_up</span>
              Receita
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Descrição do Item</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors">notes</span>
                <input
                  required
                  autoFocus
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-slate-700 transition-all"
                  placeholder="Ex: Assinatura Mensal, Dividendos..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Valor Financeiro (BRL)</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-slate-700 transition-all font-bold"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9,.]/g, '');
                    setAmount(val);
                  }}
                />
              </div>
            </div>

            {/* Date Selection Grid */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Data do Lançamento</label>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={setToday}
                  className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedDate === new Date().toISOString().split('T')[0]
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={setYesterday}
                  className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  Ontem
                </button>
              </div>

              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors text-lg">calendar_month</span>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${type === 'credit'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 shadow-lg'
                : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20 shadow-lg'
                }`}
            >
              <span className="material-symbols-outlined">check_circle</span>
              Efetivar Lançamento
            </button>
            <p className="text-center text-[10px] text-slate-600 mt-4 font-medium italic">
              Este lançamento será processado instantaneamente no seu balanço.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
