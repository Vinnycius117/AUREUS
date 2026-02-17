
import React, { useState, useRef, useEffect } from 'react';
import { ViewType } from '../types';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  onLogout?: () => void;
  user?: User | null;
  isPro?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout, user, isPro }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.user_metadata?.avatar_url || null
  );
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userEmail = user?.email || '';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const navItems = [
    { id: ViewType.ANALYTICS, label: 'Análise', icon: 'dashboard' },
    { id: ViewType.PORTFOLIO, label: 'Carteira', icon: 'account_balance' },
    { id: ViewType.TRANSACTIONS, label: 'Lançamentos', icon: 'receipt_long' },
    { id: ViewType.MARKET_TRENDS, label: 'Tendências', icon: 'insights' },
    { id: ViewType.SETTINGS, label: 'Configurações', icon: 'settings' },
  ];

  const handleAvatarClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    setShowProfileMenu(false);

    try {
      // Create a local preview immediately
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Url = event.target?.result as string;
        setAvatarUrl(base64Url);

        // Save to user metadata so it persists across sessions
        const { error } = await supabase.auth.updateUser({
          data: { avatar_url: base64Url },
        });

        if (error) {
          console.error('Error saving avatar:', error.message);
        }
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatarUrl(null);
    setShowProfileMenu(false);

    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: null },
    });

    if (error) {
      console.error('Error removing avatar:', error.message);
    }
  };

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    setCheckoutLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_1T1rUP0QzgIppEKcwUClOTR6',
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro no servidor do Stripe');
      }

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

  return (
    <aside className="w-20 lg:w-64 border-r border-charcoal bg-card-dark flex flex-col items-center lg:items-start py-8 transition-all duration-300 h-screen sticky top-0">
      <div className="px-6 mb-12 flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Aureus Logo"
            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(198,168,78,0.4)]"
          />
        </div>
        <span className="hidden lg:block text-2xl font-bold tracking-tight text-white uppercase">
          AUREUS<span className="text-primary">.</span>
        </span>
      </div>

      <nav className="w-full px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === item.id
              ? 'bg-primary/10 text-primary'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <span className="material-icons">{item.icon}</span>
            <span className="hidden lg:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-4 w-full">
        {/* 🔥 AUREUS PRO — Strategic CTA */}
        {!isPro && (
          <div className="hidden lg:block mb-4">
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card-dark to-primary/5 p-4">
              {/* Decorative shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons text-primary text-lg">workspace_premium</span>
                  <p className="text-[10px] text-primary uppercase tracking-widest font-bold">Aureus PRO</p>
                </div>
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  Desbloqueie relatórios avançados, consultoria exclusiva e muito mais.
                </p>
                <button
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-primary to-gold-light hover:from-primary hover:to-primary text-background-dark text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? 'Processando...' : '✦ Assinar AUREUS PRO'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile PRO button */}
        {!isPro && (
          <div className="lg:hidden flex justify-center mb-4">
            <button
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center hover:from-primary/30 hover:to-primary/20 transition-all group disabled:opacity-50"
              title="Assinar AUREUS PRO"
            >
              <span className="material-icons text-primary text-xl group-hover:scale-110 transition-transform">
                {checkoutLoading ? 'sync' : 'workspace_premium'}
              </span>
            </button>
          </div>
        )}



        {/* 👤 User Account Section with Profile Photo */}
        <div className="relative border-t border-charcoal pt-4" ref={profileMenuRef}>
          <div className="flex items-center justify-between gap-3 px-2 lg:px-4 py-2">
            <div className="flex items-center gap-3 group cursor-pointer overflow-hidden" onClick={handleAvatarClick}>
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all overflow-hidden ${avatarUrl
                  ? 'border-primary/50 group-hover:border-primary'
                  : 'bg-primary/20 border-primary/30 group-hover:border-primary'
                  }`}>
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-bold text-primary">{initials}</span>
                  )}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card-dark"></div>
              </div>
              {/* User info */}
              <div className="hidden lg:block overflow-hidden">
                <p className="text-sm font-semibold text-white truncate max-w-[120px]">{userName}</p>
                <p className="text-[10px] text-slate-400 font-medium tracking-tight truncate max-w-[120px]">{userEmail}</p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-400/10"
                title="Sair"
              >
                <span className="material-icons text-xl">logout</span>
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Profile popup menu */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-2 lg:left-4 mb-2 w-56 bg-charcoal border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in zoom-in-95">
              {/* User header in popup */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border overflow-hidden ${avatarUrl
                    ? 'border-primary/50'
                    : 'bg-primary/20 border-primary/30'
                    }`}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{initials}</span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{userName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Menu options */}
              <div className="p-2">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                >
                  <span className="material-icons text-lg text-primary/70">add_a_photo</span>
                  {avatarUrl ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'}
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                  >
                    <span className="material-icons text-lg text-rose-400/70">delete</span>
                    Remover foto
                  </button>
                )}
                <button
                  onClick={() => { setView(ViewType.SETTINGS); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                >
                  <span className="material-icons text-lg text-slate-400">settings</span>
                  Configurações da conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
