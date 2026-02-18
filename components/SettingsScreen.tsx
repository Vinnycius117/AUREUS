
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthInput, AuthButton } from './AuthUI';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type SettingsTab = 'perfil' | 'seguranca' | 'assinatura' | 'notificacoes';

interface SettingsScreenProps {
    user: User;
    isPro?: boolean;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, isPro }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<SettingsTab>('perfil');

    // ── Profile state ──
    const [name, setName] = useState(user.user_metadata?.full_name || '');
    const [email] = useState(user.email || '');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ── Security state ──
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityLoading, setSecurityLoading] = useState(false);
    const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    // ── Subscription state ──
    const [cancelLoading, setCancelLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [cancelMessage, setCancelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // ── Notifications state ──
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifTransactions, setNotifTransactions] = useState(true);
    const [notifReports, setNotifReports] = useState(false);
    const [notifMarketing, setNotifMarketing] = useState(false);

    const tabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: 'perfil', label: 'Perfil', icon: 'person' },
        { id: 'seguranca', label: 'Segurança', icon: 'lock' },
        { id: 'assinatura', label: 'Assinatura', icon: 'workspace_premium' },
        { id: 'notificacoes', label: 'Notificações', icon: 'notifications' },
    ];

    // ── Handlers ──────────────────────────────────────────────────────

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage(null);

        const { error } = await supabase.auth.updateUser({
            data: { full_name: name }
        });

        if (error) {
            setProfileMessage({ type: 'error', text: error.message });
        } else {
            setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        }
        setProfileLoading(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSecurityLoading(true);
        setSecurityMessage(null);

        if (newPassword.length < 6) {
            setSecurityMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
            setSecurityLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setSecurityMessage({ type: 'error', text: 'As senhas não coincidem.' });
            setSecurityLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            setSecurityMessage({ type: 'error', text: error.message });
        } else {
            setSecurityMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setSecurityLoading(false);
    };

    const handleCancelSubscription = async () => {
        setShowCancelModal(false);
        setCancelLoading(true);
        setCancelMessage(null);

        try {
            // Get subscription info from Supabase
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('stripe_subscription_id')
                .eq('user_id', user.id)
                .single();

            if (!sub?.stripe_subscription_id) {
                setCancelMessage({ type: 'error', text: 'Nenhuma assinatura ativa encontrada.' });
                setCancelLoading(false);
                return;
            }

            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId: sub.stripe_subscription_id,
                    userId: user.id,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setCancelMessage({ type: 'success', text: 'Assinatura cancelada. Você terá acesso até o final do período pago.' });
            } else {
                setCancelMessage({ type: 'error', text: result.message || 'Erro ao cancelar assinatura.' });
            }
        } catch (err: any) {
            setCancelMessage({ type: 'error', text: 'Erro de conexão ao cancelar assinatura.' });
        }

        setCancelLoading(false);
    };

    const handleSubscribe = async () => {
        if (!import.meta.env.VITE_STRIPE_PRICE_ID) {
            alert('Erro: O ID do plano (VITE_STRIPE_PRICE_ID) não foi configurado no Vercel. Por favor, adicione-o nas configurações do projeto.');
            return;
        }

        setCheckoutLoading(true);
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
                    userId: user.id,
                    email: user.email,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro no servidor do Stripe');
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('URL de checkout não recebida');
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            alert(`Erro ao iniciar checkout: ${err.message}`);
        } finally {
            setCheckoutLoading(false);
        }
    };

    // ── Message Component ─────────────────────────────────────────────
    const MessageBanner = ({ message }: { message: { type: 'success' | 'error'; text: string } | null }) => {
        if (!message) return null;
        return (
            <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/50 text-rose-400'}`}>
                <span className="material-icons text-lg">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                {message.text}
            </div>
        );
    };

    // ── Toggle Component ──────────────────────────────────────────────
    const Toggle = ({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description: string }) => (
        <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
            <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${enabled ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-charcoal border border-white/10'}`}
            >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${enabled ? 'left-6' : 'left-1'}`} />
            </button>
        </div>
    );

    // ── Tab Content Renderers ─────────────────────────────────────────

    const renderPerfil = () => (
        <section className="bg-card-dark border border-white/5 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="material-icons text-primary">person</span>
                Informações Pessoais
            </h3>

            <MessageBanner message={profileMessage} />

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
                        <AuthButton type="submit" disabled={profileLoading}>
                            {profileLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </AuthButton>
                    </div>
                </div>
            </form>
        </section>
    );

    const renderSeguranca = () => (
        <section className="bg-card-dark border border-white/5 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="material-icons text-primary">lock</span>
                Segurança da Conta
            </h3>

            <MessageBanner message={securityMessage} />

            <form onSubmit={handleChangePassword} className="space-y-6">
                <AuthInput
                    label="Senha Atual"
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    showVisibilityToggle
                    onToggleVisibility={() => setShowCurrentPw(!showCurrentPw)}
                />

                <AuthInput
                    label="Nova Senha"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    showVisibilityToggle
                    onToggleVisibility={() => setShowNewPw(!showNewPw)}
                />

                <AuthInput
                    label="Confirmar Nova Senha"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                />

                <div className="pt-4 flex justify-end">
                    <div className="w-full md:w-auto md:min-w-[200px]">
                        <AuthButton type="submit" disabled={securityLoading}>
                            {securityLoading ? 'Alterando...' : 'Alterar Senha'}
                        </AuthButton>
                    </div>
                </div>
            </form>

            {/* Additional Security Info */}
            <div className="mt-8 pt-6 border-t border-white/5">
                <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Informações de Segurança</h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <span className="material-icons text-slate-500 text-lg">email</span>
                            <span className="text-sm text-slate-400">E-mail de recuperação</span>
                        </div>
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full font-bold">Verificado</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <span className="material-icons text-slate-500 text-lg">schedule</span>
                            <span className="text-sm text-slate-400">Último login</span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );

    const renderAssinatura = () => (
        <div className="space-y-6">
            {/* Status Card */}
            <section className={`relative overflow-hidden group rounded-2xl border p-8 shadow-2xl ${isPro ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card-dark to-black shadow-emerald-500/5' : 'border-primary/30 bg-gradient-to-br from-primary/20 via-card-dark to-black shadow-primary/5'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <span className={`material-icons text-5xl ${isPro ? 'text-emerald-400' : 'text-primary'}`}>auto_awesome</span>
                </div>

                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-2">AUREUS PRO</h3>
                    <p className="text-slate-500 text-xs mb-6">Gerencie sua assinatura e benefícios</p>

                    <MessageBanner message={cancelMessage} />

                    {isPro ? (
                        <>
                            {/* Active Subscription Info */}
                            <div className="flex items-center gap-3 mb-6 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                <span className="material-icons text-emerald-400 text-3xl">verified</span>
                                <div>
                                    <p className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Assinatura Ativa</p>
                                    <p className="text-slate-400 text-xs">Você tem acesso completo a todos os recursos premium.</p>
                                </div>
                            </div>

                            {/* Subscription Details */}
                            <div className="bg-white/[0.02] rounded-xl border border-white/5 divide-y divide-white/5 mb-6">
                                <div className="flex justify-between items-center px-5 py-4">
                                    <span className="text-sm text-slate-400">Plano</span>
                                    <span className="text-sm text-white font-bold">AUREUS PRO</span>
                                </div>
                                <div className="flex justify-between items-center px-5 py-4">
                                    <span className="text-sm text-slate-400">Valor</span>
                                    <span className="text-sm text-white font-bold">R$ 29,90/mês</span>
                                </div>
                                <div className="flex justify-between items-center px-5 py-4">
                                    <span className="text-sm text-slate-400">Status</span>
                                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Ativo</span>
                                </div>
                                <div className="flex justify-between items-center px-5 py-4">
                                    <span className="text-sm text-slate-400">Método de pagamento</span>
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons text-slate-500 text-base">credit_card</span>
                                        <span className="text-sm text-white font-medium">Via Stripe</span>
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <h4 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Recursos Inclusos</h4>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'Relatórios PDF personalizados ilimitados',
                                    'Análise de tendências em tempo real',
                                    'Suporte direto por chat com consultores',
                                    'Exportação avançada de dados (CSV/Excel)'
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                                        <span className="material-icons text-emerald-400 text-base">check_circle</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* Cancel Button */}
                            <div className="pt-4 border-t border-white/5">
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    disabled={cancelLoading}
                                    className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 hover:border-rose-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-icons text-sm">cancel</span>
                                    {cancelLoading ? 'Cancelando...' : 'Cancelar Assinatura'}
                                </button>
                                <p className="text-[10px] text-slate-600 mt-3 px-1">
                                    Ao cancelar, você mantém o acesso até o final do período pago atual.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
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

                            <button
                                onClick={handleSubscribe}
                                disabled={checkoutLoading}
                                className="px-8 py-3.5 bg-gradient-to-r from-primary to-gold-light hover:from-primary hover:to-primary text-background-dark font-bold rounded-xl uppercase tracking-wider text-xs transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                {checkoutLoading ? '✦ Processando...' : '✦ Assinar agora por R$ 29,90/mês'}
                            </button>
                        </>
                    )}
                </div>
            </section>
        </div>
    );

    const renderNotificacoes = () => (
        <section className="bg-card-dark border border-white/5 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="material-icons text-primary">notifications</span>
                Preferências de Notificação
            </h3>
            <p className="text-xs text-slate-500 mb-6">Configure como e quando deseja receber notificações.</p>

            <div className="space-y-1">
                <Toggle
                    enabled={notifEmail}
                    onChange={setNotifEmail}
                    label="Notificações por E-mail"
                    description="Receba resumos e alertas importantes no seu e-mail."
                />
                <Toggle
                    enabled={notifTransactions}
                    onChange={setNotifTransactions}
                    label="Alertas de Transações"
                    description="Seja notificado sobre lançamentos, entradas e saídas."
                />
                <Toggle
                    enabled={notifReports}
                    onChange={setNotifReports}
                    label="Relatórios Semanais"
                    description="Receba um resumo semanal do seu desempenho financeiro."
                />
                <Toggle
                    enabled={notifMarketing}
                    onChange={setNotifMarketing}
                    label="Novidades e Promoções"
                    description="Fique por dentro de novas funcionalidades e ofertas."
                />
            </div>

            <div className="pt-6 mt-4 border-t border-white/5">
                <p className="text-[10px] text-slate-600 italic">
                    As preferências de notificação são salvas automaticamente.
                </p>
            </div>
        </section>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'perfil': return renderPerfil();
            case 'seguranca': return renderSeguranca();
            case 'assinatura': return renderAssinatura();
            case 'notificacoes': return renderNotificacoes();
        }
    };

    // ── Cancellation Modal Component ──────────────────────────────────
    const CancelModal = () => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowCancelModal(false)}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-card-dark border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-300 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 blur-[80px] rounded-full"></div>

                <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                        <span className="material-icons text-3xl text-rose-400">warning_amber</span>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Tem certeza?</h3>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                        Ao cancelar sua assinatura <span className="text-primary font-bold">AUREUS PRO</span>, você perderá acesso aos insights exclusivos, relatórios premium e consultoria direta no final do ciclo atual.
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => setShowCancelModal(false)}
                            className="w-full py-4 bg-primary hover:bg-[#B59844] text-background-dark font-bold rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-primary/10"
                        >
                            MANTER MEU PLANO PRO
                        </button>
                        <button
                            onClick={handleCancelSubscription}
                            className="w-full py-3.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-widest"
                        >
                            Confirmar Cancelamento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

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
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isPro ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-primary/10 border border-primary/20'}`}>
                                    <span className={`w-2 h-2 rounded-full animate-pulse ${isPro ? 'bg-emerald-500' : 'bg-primary'}`}></span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isPro ? 'text-emerald-400' : 'text-primary'}`}>{isPro ? 'Plano PRO' : 'Plano Free'}</span>
                                </div>
                            </div>
                        </section>

                        <nav className="flex flex-col space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 ${activeTab === tab.id
                                        ? 'bg-primary/10 text-primary font-bold'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <span className={`material-icons text-lg ${activeTab === tab.id ? 'text-primary' : 'text-slate-600'}`}>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Right Column: Dynamic Content */}
                    <div className="md:col-span-2">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {showCancelModal && <CancelModal />}
        </div>
    );
};

export default SettingsScreen;
