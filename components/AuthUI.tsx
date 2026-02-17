
import React from 'react';
import { useTranslation } from 'react-i18next';

export const Logo: React.FC = () => (
    <div className="inline-flex items-center justify-center w-14 h-14 mb-6">
        <img
            src="/logo.png"
            alt="Aureus Logo"
            className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(198,168,78,0.4)]"
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
            }}
        />
    </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    onToggleVisibility?: () => void;
    showVisibilityToggle?: boolean;
}

export const AuthInput: React.FC<InputProps> = ({
    label,
    error,
    showVisibilityToggle,
    onToggleVisibility,
    ...props
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-1.5 group">
            <div className="flex justify-between items-center px-1">
                <label className={`block text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-300 ${error ? 'text-rose-400' : 'text-primary/90'}`}>
                    {label}
                </label>
                {error && (
                    <span className="text-[10px] font-semibold text-rose-400/90 uppercase tracking-tighter animate-pulse">
                        {t('common.attention')}
                    </span>
                )}
            </div>

            <div className="relative">
                <input
                    {...props}
                    className={`w-full bg-transparent rounded-lg py-3.5 px-4 text-white placeholder:text-white/10 focus:outline-none transition-all duration-300 
            ${error
                            ? 'border border-rose-500/50 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                            : 'border border-[rgba(198,168,79,0.2)] focus:border-[rgba(198,168,79,0.8)] focus:shadow-[0_0_0_1px_rgba(198,168,79,0.2)] hover:border-primary/40'} 
            ${props.type === 'password' ? 'pr-12' : ''}`}
                />
                {showVisibilityToggle && (
                    <button
                        type="button"
                        onClick={onToggleVisibility}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-rose-400/60 hover:text-rose-400' : 'text-primary/60 hover:text-primary'}`}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {props.type === 'password' ? 'visibility' : 'visibility_off'}
                        </span>
                    </button>
                )}
            </div>

            {/* Elegant Custom Error Message */}
            <div className={`overflow-hidden transition-all duration-300 ease-out ${error ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <p className="text-[11px] text-rose-400/90 flex items-center gap-1.5 px-1">
                    <span className="material-symbols-outlined text-sm">info</span>
                    {error}
                </p>
            </div>
        </div>
    );
};

export const AuthButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
    <button
        {...props}
        className="w-full bg-primary hover:bg-[#B59844] text-white font-semibold py-4 rounded-lg transition-all duration-300 transform active:scale-[0.99] shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {children}
    </button>
);

export const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLanguage = i18n.language.split('-')[0];

    return (
        <div className="mt-12 flex items-center justify-center space-x-6 text-[10px] uppercase tracking-[0.15em] font-medium">
            <button
                onClick={() => changeLanguage('pt')}
                className={`hover:text-primary transition-colors cursor-pointer ${currentLanguage === 'pt' ? 'text-primary' : 'text-white/30'}`}
            >
                Português
            </button>
            <span className="w-1 h-1 bg-white/10 rounded-full"></span>
            <button
                onClick={() => changeLanguage('en')}
                className={`hover:text-primary transition-colors cursor-pointer ${currentLanguage === 'en' ? 'text-primary' : 'text-white/30'}`}
            >
                English
            </button>
            <span className="w-1 h-1 bg-white/10 rounded-full"></span>
            <button
                onClick={() => changeLanguage('es')}
                className={`hover:text-primary transition-colors cursor-pointer ${currentLanguage === 'es' ? 'text-primary' : 'text-white/30'}`}
            >
                Español
            </button>
        </div>
    );
};
