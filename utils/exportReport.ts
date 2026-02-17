
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateFinancialInsights = (stats: any) => {
    const { total, income, expenses } = stats;
    const insights = [];

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    if (savingsRate > 20) {
        insights.push({
            title: "Alta Taxa de Poupança",
            text: "Sua taxa de poupança está excelente! Considere diversificar seus investimentos em ativos de maior rentabilidade para acelerar o crescimento patrimonial."
        });
    } else if (savingsRate > 0) {
        insights.push({
            title: "Fluxo de Caixa Positivo",
            text: "Você está gastando menos do que ganha. Tente automatizar seus investimentos logo no início do mês para aumentar sua disciplina financeira."
        });
    } else {
        insights.push({
            title: "Alerta de Fluxo de Caixa",
            text: "Seus gastos estão superando suas receitas. Identifique despesas não essenciais (assinaturas, lazer excessivo) para retomar o equilíbrio."
        });
    }

    if (total > 50000 && savingsRate > 10) {
        insights.push({
            title: "Otimização de Patrimônio",
            text: "Com um patrimônio sólido, avalie a alocação em ativos com baixa liquidez para buscar prêmios de risco melhores."
        });
    }

    if (expenses > (income * 0.7) && income > 0) {
        insights.push({
            title: "Controle de Gastos",
            text: "Seus gastos fixos e variáveis consomem mais de 70% da sua renda. Recomenda-se uma revisão detalhada para evitar endividamento futuro."
        });
    }

    return insights;
};

export const exportToPDF = async (chartRef: HTMLElement, stats: any, transactions: any[]) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(14, 14, 14); // Dark background
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Add Logo to PDF if possible (using the same path)
    try {
        // Since jsPDF is running in browser context, it can fetch from /public (as /logo.png)
        // Adjusting logo placement to the left, and text to follow
        doc.addImage('/logo.png', 'PNG', 12, 8, 18, 24);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("AUREUS WEALTH", 35, 22);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(198, 168, 78); // Gold color
        doc.text("RELATÓRIO DE INTELIGÊNCIA FINANCEIRA", 35, 29);
    } catch (e) {
        // Fallback if image fails
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("AUREUS WEALTH", 15, 20);
    }

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), pageWidth - 15, 20, { align: 'right' });

    // Summary Tiles
    doc.setTextColor(14, 14, 14);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO", 15, 52);

    doc.setDrawColor(230, 230, 230);
    doc.line(15, 55, pageWidth - 15, 55);

    // Totals - Balanced Weights
    const formatValue = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Patrimônio Total:", 15, 65);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(14, 14, 14);
    doc.text(formatValue(stats.total), 55, 65);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Total Entradas:", 15, 72);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(formatValue(stats.income), 55, 72);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Total Saídas:", 15, 79);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(244, 63, 94); // rose
    doc.text(formatValue(stats.expenses), 55, 79);

    // Chart Capture
    try {
        // Wait a bit for animations to be in a good state
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(chartRef, {
            backgroundColor: '#121212',
            scale: 3,
            logging: false,
            useCORS: true
        });
        const imgData = canvas.toDataURL('image/png');
        // Better aspect ratio (approx 2.5:1)
        doc.addImage(imgData, 'PNG', 15, 85, pageWidth - 30, 55);
    } catch (error) {
        console.error("Failed to capture chart", error);
    }

    // Financial Insights
    let currentY = 155;
    doc.setTextColor(14, 14, 14);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("INSIGHTS E DICAS ESTRATÉGICAS", 15, currentY);
    doc.line(15, currentY + 3, pageWidth - 15, currentY + 3);

    currentY += 12;
    const insights = generateFinancialInsights(stats);

    insights.forEach((insight: any) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(198, 168, 78);
        doc.text(insight.title, 15, currentY);

        currentY += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        const textLines = doc.splitTextToSize(insight.text, pageWidth - 30);
        doc.text(textLines, 15, currentY);
        currentY += (textLines.length * 5) + 5;
    });

    // Transaction Table
    if (currentY > 240) {
        doc.addPage();
        currentY = 20;
    } else {
        currentY += 10;
    }

    doc.setTextColor(14, 14, 14);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("HISTÓRICO RECENTE", 15, currentY);
    doc.line(15, currentY + 3, pageWidth - 15, currentY + 3);

    currentY += 12;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Descrição", 15, currentY);
    doc.text("Data", pageWidth - 75, currentY); // Moved further left for safety
    doc.text("Valor", pageWidth - 15, currentY, { align: 'right' });

    currentY += 3;
    doc.setDrawColor(240, 240, 240);
    doc.line(15, currentY, pageWidth - 15, currentY);

    currentY += 5;
    doc.setFont("helvetica", "normal");

    transactions.slice(0, 25).forEach((tx) => {
        if (currentY > 280) {
            doc.addPage();
            currentY = 20;
        }

        // Shorten the date for the PDF to save space: "14 de fev. de 2026" -> "14/02/2026"
        const dateParts = tx.date.split(' de ');
        const day = dateParts[0];
        const months: Record<string, string> = {
            'jan.': '01', 'fev.': '02', 'mar.': '03', 'abr.': '04', 'mai.': '05', 'jun.': '06',
            'jul.': '07', 'ago.': '08', 'set.': '09', 'out.': '10', 'nov.': '11', 'dez.': '12'
        };
        const month = months[dateParts[1]] || '00';
        const year = dateParts[2];
        const shortDate = `${day}/${month}/${year}`;

        doc.text(tx.details, 15, currentY);
        doc.text(shortDate, pageWidth - 75, currentY); // Matches header

        if (tx.amount < 0) doc.setTextColor(244, 63, 94); // rose-500
        else doc.setTextColor(16, 185, 129); // emerald-500

        doc.text(formatValue(tx.amount), pageWidth - 15, currentY, { align: 'right' });
        doc.setTextColor(0, 0, 0);

        currentY += 6;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Aureus Wealth - Relatório Digital | Página ${i} de ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
    }

    doc.save(`Aureus_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
