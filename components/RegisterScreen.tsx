
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo, AuthInput, AuthButton, LanguageSelector } from './AuthUI';
import { supabase } from '../lib/supabase';
import LiquidEther from './LiquidEther';

type AuthScreen = 'LOGIN' | 'REGISTER';

interface RegisterScreenProps {
    onNavigate: (screen: AuthScreen) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!name) newErrors.name = t('register.errors.nameRequired');
        if (!email) {
            newErrors.email = t('register.errors.emailRequired');
        } else if (!/\S+@\S+\.\S/.test(email)) {
            newErrors.email = t('register.errors.emailInvalid');
        }
        if (password.length < 8) newErrors.password = t('register.errors.passwordMin');
        if (password !== confirmPassword) newErrors.confirmPassword = t('register.errors.passwordsMatch');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setLoading(true);
            const { error, data } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) {
                setErrors({ ...errors, submit: error.message });
                setLoading(false);
            } else {
                // If Supabase is configured with email confirmation, it won't login automatically.
                // We show the success popup.
                setShowSuccessPopup(true);
                setLoading(false);
            }
        }
    };

    const handleFieldChange = (field: string, value: string, setter: (val: string) => void) => {
        setter(value);
        if (errors[field]) {
            const newErrors = { ...errors };
            delete newErrors[field];
            setErrors(newErrors);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background-dark relative overflow-hidden">
            {/* Dynamic Success Popup Overlay */}
            {showSuccessPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-500">
                    <div className="w-full max-w-sm bg-card-dark border border-primary/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(198,168,79,0.15)] text-center transform animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_20px_rgba(198,168,79,0.1)]">
                            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">mail</span>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                            {t('register.success.title')}
                        </h2>

                        <p className="text-slate-300 text-sm leading-relaxed mb-4">
                            {t('register.success.message')}
                        </p>

                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-8">
                            <p className="text-[11px] text-primary/80 uppercase tracking-widest font-bold mb-1">
                                Pro tip
                            </p>
                            <p className="text-xs text-slate-400">
                                {t('register.success.spamNotice')}
                            </p>
                        </div>

                        <button
                            onClick={() => onNavigate('LOGIN')}
                            className="w-full bg-primary hover:bg-[#B59844] text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform active:scale-[0.98]"
                        >
                            {t('register.success.confirm')}
                        </button>
                    </div>
                </div>
            )}

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
                    <h1 className="text-3xl font-medium tracking-tight text-white mb-2">{t('register.title')}</h1>
                    <p className="text-slate-400 text-sm tracking-wide">{t('register.subtitle')}</p>
                </div>

                <div className="bg-card-dark border border-[rgba(198,168,79,0.2)] p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
                    {errors.submit && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                            {errors.submit}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        <AuthInput
                            label={t('common.fullName')}
                            placeholder={t('common.namePlaceholder')}
                            value={name}
                            onChange={(e) => handleFieldChange('name', e.target.value, setName)}
                            error={errors.name}
                        />

                        <AuthInput
                            label={t('common.email')}
                            type="email"
                            placeholder={t('common.emailPlaceholder')}
                            value={email}
                            onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
                            error={errors.email}
                        />

                        <div className="space-y-2">
                            <AuthInput
                                label={t('common.password')}
                                type="password"
                                placeholder={t('common.passwordPlaceholder')}
                                value={password}
                                onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
                                error={errors.password}
                            />
                            {!errors.password && (
                                <div className="flex gap-1 px-1 pt-1">
                                    <div className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${password.length > 4 ? 'bg-primary' : 'bg-primary/20'}`}></div>
                                    <div className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${password.length > 7 ? 'bg-primary' : 'bg-primary/20'}`}></div>
                                    <div className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${password.length > 9 ? 'bg-primary' : 'bg-white/5'}`}></div>
                                </div>
                            )}
                        </div>

                        <AuthInput
                            label={t('common.confirmPassword')}
                            type="password"
                            placeholder={t('common.passwordPlaceholder')}
                            value={confirmPassword}
                            onChange={(e) => handleFieldChange('confirmPassword', e.target.value, setConfirmPassword)}
                            error={errors.confirmPassword}
                        />

                        <div className="pt-4">
                            <AuthButton type="submit" disabled={loading}>
                                {loading ? t('common.loading') : t('register.submit')}
                            </AuthButton>
                        </div>

                        <p className="text-[11px] text-center text-white/30 px-4 leading-relaxed">
                            {t('register.agreement')} <button type="button" className="text-primary/60 hover:text-primary transition-colors">{t('common.terms')}</button> {t('common.and')} <button type="button" className="text-primary/60 hover:text-primary transition-colors">{t('common.privacy')}</button>.
                        </p>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-400/80">
                        {t('register.hasAccount')}
                        <button
                            onClick={() => onNavigate('LOGIN')}
                            className="text-primary font-semibold hover:underline underline-offset-4 decoration-primary/30 transition-all ml-1"
                        >
                            {t('register.login')}
                        </button>
                    </p>
                </div>

                <LanguageSelector />
            </div>
        </div>
    );
};
