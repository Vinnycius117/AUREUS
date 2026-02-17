
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthInput, AuthButton } from './AuthUI';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface SettingsScreenProps {
    user: User;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ user }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(user.user_metadata?.full_name || '');
    const [email] = useState(user.email || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.updateUser({
            data: { full_name: name }
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        }
        setLoading(false);
    };

    return (
        <div className="flex-1 bg-background-dark overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Configurações</h1>
                    <p className="text-slate-400">Gerencie sua conta, preferências e assinatura.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Navigation/Summary */}
                    <div className="md:col-span-1 space-y-4">
                        <section className="bg-card-dark border border-white/5 rounded-2xl p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 mb-4 overflow-hidden">
                                    {user.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-primary">
                                            {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-lg font-bold text-white mb-1">{user.user_metadata?.full_name || 'Usuário'}</h2>
                                <p className="text-xs text-slate-400 mb-4">{user.email}</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Plano Free</span>
                                </div>
                            </div>
                        </section>

                        <nav className="flex flex-col space-y-1">
                            {['Perfil', 'Segurança', 'Assinatura', 'Notificações'].map((item) => (
                                <button
                                    key={item}
                                    className={`text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${item === 'Perfil' ? 'bg-primary/10 text-primary font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Right Column: Content Area */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Profile Section */}
                        <section className="bg-card-dark border border-white/5 rounded-2xl p-8 shadow-xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="material-icons text-primary">person</span>
                                Informações Pessoais
                            </h3>

                            {message && (
                                <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/50 text-rose-400'}`}>
                                    <span className="material-icons text-lg">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <AuthInput
                                    label="Nome Completo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                />

                                <AuthInput
                                    label="Endereço de E-mail"
                                    value={email}
                                    disabled
                                    placeholder="seu@email.com"
                                />
                                <p className="text-[10px] text-slate-500 px-1 -mt-4">O e-mail não pode ser alterado diretamente.</p>

                                <div className="pt-4 flex justify-end">
                                    <div className="w-full md:w-auto md:min-w-[200px]">
                                        <AuthButton type="submit" disabled={loading}>
                                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                                        </AuthButton>
                                    </div>
                                </div>
                            </form>
                        </section>

                        {/* Subscription Card (CTA) */}
                        <section className="relative overflow-hidden group rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card-dark to-black p-8 shadow-2xl shadow-primary/5">
                            {/* Decorative Sparkles */}
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                                <span className="material-icons text-5xl text-primary">auto_awesome</span>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-white mb-4">AUREUS PRO</h3>
                                <p className="text-slate-300 text-sm mb-6 max-w-md leading-relaxed">
                                    Eleve seu patamar financeiro. Tenha acesso a relatórios consolidados de alta precisão, suporte prioritário e insights exclusivos do mercado.
                                </p>

                                <ul className="space-y-3 mb-8">
                                    {[
                                        'Relatórios PDF personalizados ilimitados',
                                        'Análise de tendências em tempo real',
                                        'Suporte direto por chat com consultores',
                                        'Exportação avançada de dados (CSV/Excel)'
                                    ].map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                                            <span className="material-icons text-primary text-base">verified</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button className="px-8 py-3.5 bg-gradient-to-r from-primary to-gold-light hover:from-primary hover:to-primary text-background-dark font-bold rounded-xl uppercase tracking-wider text-xs transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:scale-[1.02] active:scale-[0.98]">
                                    ✦ Assinar agora por R$ 29,90/mês
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;
