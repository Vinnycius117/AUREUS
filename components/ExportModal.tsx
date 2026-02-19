
import React, { useState } from 'react';
import { Transaction, PortfolioAsset, Goal } from '../types';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    assets: PortfolioAsset[];
    goals: Goal[];
}

type ExportFormat = 'pdf' | 'csv';
type DataSection = 'transactions' | 'assets' | 'goals';

const SECTIONS: { id: DataSection; label: string; icon: string; description: string }[] = [
    { id: 'transactions', label: 'Transações', icon: 'receipt_long', description: 'Histórico completo de receitas e despesas' },
    { id: 'assets', label: 'Ativos', icon: 'account_balance_wallet', description: 'Carteira patrimonial e alocação' },
    { id: 'goals', label: 'Objetivos', icon: 'flag', description: 'Metas financeiras e progresso' },
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, transactions, assets, goals }) => {
    const [format, setFormat] = useState<ExportFormat>('pdf');
    const [selectedSections, setSelectedSections] = useState<Set<DataSection>>(new Set(['transactions']));
    const [exporting, setExporting] = useState(false);

    if (!isOpen) return null;

    const toggleSection = (section: DataSection) => {
        setSelectedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) {
                if (next.size > 1) next.delete(section); // keep at least one
            } else {
                next.add(section);
            }
            return next;
        });
    };

    const sectionCounts: Record<DataSection, number> = {
        transactions: transactions.length,
        assets: assets.length,
        goals: goals.length,
    };

    // ── CSV Generator ───────────────────────────────────────────────────
    const generateCSV = () => {
        const parts: string[] = [];

        if (selectedSections.has('transactions')) {
            parts.push('=== TRANSAÇÕES ===');
            parts.push('Data,Descrição,Tipo,Valor,Referência');
            transactions.forEach(t => {
                parts.push(`"${t.date}","${t.details}","${t.type === 'credit' ? 'Receita' : 'Despesa'}","${formatCurrency(t.amount)}","${t.reference || ''}"`);
            });
            parts.push('');
        }

        if (selectedSections.has('assets')) {
            parts.push('=== ATIVOS ===');
            parts.push('Nome,Categoria,Status,Valor Atual,Meta (%)');
            assets.forEach(a => {
                parts.push(`"${a.name}","${a.category}","${a.status === 'invested' ? 'Investido' : 'Liquidez'}","${formatCurrency(Number(a.current_value))}","${a.target_percent}%"`);
            });
            parts.push('');
        }

        if (selectedSections.has('goals')) {
            parts.push('=== OBJETIVOS ===');
            parts.push('Nome,Meta,Atual,Progresso,Prazo');
            goals.forEach(g => {
                const progress = g.target_amount > 0 ? ((Number(g.current_amount) / Number(g.target_amount)) * 100).toFixed(1) : '0';
                parts.push(`"${g.name}","${formatCurrency(Number(g.target_amount))}","${formatCurrency(Number(g.current_amount))}","${progress}%","${g.deadline || 'Sem prazo'}"`);
            });
            parts.push('');
        }

        return parts.join('\n');
    };

    // ── PDF Generator (Simple HTML → Print) ─────────────────────────────
    const generatePDF = () => {
        const sections: string[] = [];
        const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

        if (selectedSections.has('transactions')) {
            const rows = transactions.map(t => `
                <tr>
                    <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#94a3b8;font-size:11px">${t.date}</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#e2e8f0;font-size:12px;font-weight:600">${t.details}</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:${t.amount >= 0 ? '#22c55e' : '#f87171'};font-size:12px;font-weight:700;text-align:right">${formatCurrency(t.amount)}</td>
                </tr>
            `).join('');
            sections.push(`
                <h2 style="font-size:16px;color:#c8b06b;text-transform:uppercase;letter-spacing:3px;margin:32px 0 16px;font-weight:900">Transações</h2>
                <table style="width:100%;border-collapse:collapse"><thead><tr>
                    <th style="padding:10px 12px;border-bottom:2px solid #c8b06b;text-align:left;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:900">Data</th>
                    <th style="padding:10px 12px;border-bottom:2px solid #c8b06b;text-align:left;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:900">Descrição</th>
                    <th style="padding:10px 12px;border-bottom:2px solid #c8b06b;text-align:right;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:900">Valor</th>
                </tr></thead><tbody>${rows}</tbody></table>
            `);
        }

        if (selectedSections.has('assets')) {
            const rows = assets.map(a => `
                <tr>
                    <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#e2e8f0;font-size:12px;font-weight:600">${a.name}</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#94a3b8;font-size:11px">${a.category}</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:${a.status === 'invested' ? '#22c55e' : '#38bdf8'};font-size:11px">${a.status === 'invested' ? 'Investido' : 'Liquidez'}</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#e2e8f0;font-size:12px;font-weight:700;text-align:right">${formatCurrency(Number(a.current_value))}</td>
                </tr>
            `).join('');
            sections.push(`
                <h2 style="font-size:16px;color:#c8b06b;text-transform:uppercase;letter-spacing:3px;margin:32px 0 16px;font-weight:900">Ativos</h2>
                <table style="width:100%;border-collapse:collapse"><thead><tr>
                    <th style="padding:10px 12px;border-bottom:2px solid #c8b06b;text-align:left;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:900">Nome</th>
                    <th style="padding:10px 12px;border-bottom:2px solid #c8b06b;text-align:left;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:900">Categoria</th>
                    <th style="padding:10px 12px;border-bottom:2px solid #c8b06b;text-align:left;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:900">Status</th>
                    <th style="padding:10px 12px;border-bottom:2px solid #c8b06b;text-align:right;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:900">Valor</th>
                </tr></thead><tbody>${rows}</tbody></table>
            `);
        }

        if (selectedSections.has('goals')) {
            const rows = goals.map(g => {
                const progress = g.target_amount > 0 ? ((Number(g.current_amount) / Number(g.target_amount)) * 100).toFixed(1) : '0';
                return `
                <tr>
                    <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#e2e8f0;font-size:12px;font-weight:600">${g.name}</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#94a3b8;font-size:11px;text-align:right">${formatCurrency(Number(g.target_amount))}</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#c8b06b;font-size:12px;font-weight:700;text-align:right">${progress}%</td>
                </tr>
            `}).join('');
            sections.push(`
                <h2 style="font-size:16px;color:#c8b06b;text-transform:uppercase;letter-spacing:3px;margin:32px 0 16px;font-weight:900">Objetivos</h2>
                <table style="width:100%;border-collapse:collapse"><thead><tr>
                    <th style="padding:10px 12px;border-bottom:2px solid #c8b06b;text-align:left;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:900">Nome</th>
                    <th style="padding:10px 12px;border-bottom:2px solid #c8b06b;text-align:right;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:900">Meta</th>
                    <th style="padding:10px 12px;border-bottom:2px solid #c8b06b;text-align:right;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:900">Progresso</th>
                </tr></thead><tbody>${rows}</tbody></table>
            `);
        }

        const html = `<!DOCTYPE html><html><head><title>AUREUS — Relatório</title></head><body style="margin:0;padding:48px;background:#0a0a0a;color:#e2e8f0;font-family:'Inter','Segoe UI',sans-serif">
            <div style="max-width:800px;margin:0 auto">
                <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #c8b06b;padding-bottom:24px;margin-bottom:24px">
                    <div>
                        <h1 style="margin:0;font-size:28px;font-weight:900;color:#c8b06b;letter-spacing:6px;text-transform:uppercase">AUREUS</h1>
                        <p style="margin:4px 0 0;font-size:9px;color:#64748b;letter-spacing:3px;text-transform:uppercase;font-weight:700">RELATÓRIO FINANCEIRO PERSONAL</p>
                    </div>
                    <p style="font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;font-weight:700">${now}</p>
                </div>
                ${sections.join('')}
                <div style="margin-top:48px;padding-top:24px;border-top:1px solid #1a1a1a;text-align:center">
                    <p style="font-size:8px;color:#334155;letter-spacing:3px;text-transform:uppercase;font-weight:700">Gerado automaticamente pelo AUREUS • Gestão Financeira Inteligente</p>
                </div>
            </div>
        </body></html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
        }
    };

    // ── Handle Export ────────────────────────────────────────────────────
    const handleExport = async () => {
        setExporting(true);
        try {
            if (format === 'csv') {
                const csv = generateCSV();
                const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `aureus-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                generatePDF();
            }
        } finally {
            setTimeout(() => {
                setExporting(false);
                onClose();
            }, 600);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            <div className="relative w-full max-w-lg bg-[#111] border border-white/[0.05] rounded-3xl shadow-2xl p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-white/[0.03]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">download</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-widest">Exportar Dados</h2>
                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mt-1">AUREUS PRO</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-slate-500 text-lg">close</span>
                        </button>
                    </div>
                </div>

                {/* Format Selector */}
                <div className="px-8 pt-6 pb-4">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Formato de Exportação</p>
                    <div className="grid grid-cols-2 gap-3">
                        {([
                            { id: 'pdf' as ExportFormat, label: 'PDF', icon: 'picture_as_pdf', desc: 'Relatório para impressão' },
                            { id: 'csv' as ExportFormat, label: 'CSV', icon: 'table_chart', desc: 'Planilha para análise' },
                        ]).map(opt => (
                            <button key={opt.id} onClick={() => setFormat(opt.id)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${format === opt.id
                                    ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5'
                                    : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                                    }`}>
                                <span className={`material-symbols-outlined text-2xl ${format === opt.id ? 'text-primary' : 'text-slate-500'}`}>{opt.icon}</span>
                                <div>
                                    <p className={`text-sm font-black uppercase tracking-widest ${format === opt.id ? 'text-primary' : 'text-slate-300'}`}>{opt.label}</p>
                                    <p className="text-[9px] text-slate-600 font-bold mt-0.5">{opt.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Data Sections */}
                <div className="px-8 pt-2 pb-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Dados para Exportar</p>
                    <div className="space-y-3">
                        {SECTIONS.map(section => {
                            const active = selectedSections.has(section.id);
                            const count = sectionCounts[section.id];
                            return (
                                <button key={section.id} onClick={() => toggleSection(section.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${active
                                        ? 'bg-primary/5 border-primary/20'
                                        : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03] opacity-50'
                                        }`}>
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${active ? 'bg-primary border-primary' : 'border-slate-600'}`}>
                                        {active && <span className="material-symbols-outlined text-background-dark text-xs font-black">check</span>}
                                    </div>
                                    <span className={`material-symbols-outlined text-lg ${active ? 'text-primary' : 'text-slate-600'}`}>{section.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-400'}`}>{section.label}</p>
                                        <p className="text-[9px] text-slate-600 font-bold mt-0.5">{section.description}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600 tabular-nums">{count} itens</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Action */}
                <div className="px-8 pb-8">
                    <button onClick={handleExport} disabled={exporting}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-background-dark font-black rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-lg">{exporting ? 'hourglass_top' : 'download'}</span>
                        {exporting ? 'GERANDO...' : `EXPORTAR ${format.toUpperCase()}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
