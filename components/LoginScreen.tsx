
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo, AuthInput, AuthButton, LanguageSelector } from './AuthUI';
import { supabase } from '../lib/supabase';
import LiquidEther from './LiquidEther';

type AuthScreen = 'LOGIN' | 'REGISTER';

interface LoginScreenProps {
    onNavigate: (screen: AuthScreen) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; auth?: string }>({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!email) {
            newErrors.email = t('login.errors.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = t('login.errors.emailInvalid');
        }

        if (!password) {
            newErrors.password = t('login.errors.passwordRequired');
        } else if (password.length < 6) {
            newErrors.password = t('login.errors.passwordLength');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setErrors({ ...errors, auth: error.message });
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background-dark relative overflow-hidden">
            {/* Dynamic Animated LiquidEther Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <LiquidEther
                    colors={['#C6A84F', '#8B7635', '#E8D5A3']}
                    mouseForce={20}
                    cursorSize={100}
                    isViscous
                    viscous={30}
                    iterationsViscous={32}
                    iterationsPoisson={32}
                    resolution={0.5}
                    isBounce={false}
                    autoDemo
                    autoSpeed={0.5}
                    autoIntensity={2.2}
                    takeoverDuration={0.25}
                    autoResumeDelay={3000}
                    autoRampDuration={0.6}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <Logo />
                    <h1 className="text-3xl font-medium tracking-tight text-white mb-2">{t('login.title')}</h1>
                    <p className="text-slate-400 text-sm tracking-wide">{t('login.subtitle')}</p>
                </div>

                <div className="bg-card-dark border border-[rgba(198,168,79,0.2)] p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
                    {errors.auth && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                            {errors.auth}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} noValidate className="space-y-6">
                        <AuthInput
                            label={t('common.email')}
                            type="email"
                            placeholder={t('common.emailPlaceholder')}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: undefined });
                            }}
                            error={errors.email}
                        />

                        <AuthInput
                            label={t('common.password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('common.passwordPlaceholder')}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors({ ...errors, password: undefined });
                            }}
                            showVisibilityToggle
                            onToggleVisibility={() => setShowPassword(!showPassword)}
                            error={errors.password}
                        />

                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="text-xs text-primary font-medium hover:text-[#B59844] transition-colors uppercase tracking-wider"
                                onClick={() => alert('Recuperação de senha não implementada')}
                            >
                                {t('login.forgotPassword')}
                            </button>
                        </div>

                        <div className="pt-2">
                            <AuthButton type="submit" disabled={loading}>
                                {loading ? t('common.loading') : t('login.submit')}
                            </AuthButton>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-400/80">
                        {t('login.noAccount')}
                        <button
                            onClick={() => onNavigate('REGISTER')}
                            className="text-primary font-semibold hover:underline underline-offset-4 decoration-primary/30 transition-all ml-1"
                        >
                            {t('login.register')}
                        </button>
                    </p>
                </div>

                <LanguageSelector />
            </div>
        </div>
    );
};
