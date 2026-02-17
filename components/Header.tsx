
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onExport?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onExport }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = (e: any) => {
      // Capturamos o scroll do container pai (main/div flex-1 overflow-y-auto)
      const currentScrollY = e.target.scrollTop;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [lastScrollY]);

  return (
    <header
      className={`h-20 border-b border-charcoal flex items-center justify-between px-8 bg-card-dark sticky top-0 z-30 w-full shadow-lg transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-0.5 font-bold">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center bg-charcoal rounded-lg px-4 py-2 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
          <span className="material-icons text-primary text-sm mr-2">calendar_today</span>
          <span className="text-xs font-semibold text-slate-300">Últimos 12 Meses</span>
          <span className="material-icons text-slate-500 text-sm ml-2">expand_more</span>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-charcoal border border-white/10 hover:border-primary/50 text-slate-200 rounded-lg transition-all text-xs font-bold uppercase tracking-widest shadow-lg shadow-black/20"
        >
          <span className="material-icons text-sm text-primary">download</span>
          Exportar
        </button>
      </div>
    </header>
  );
};

export default Header;
