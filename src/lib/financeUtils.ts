/**
 * financeUtils.ts - Utilities for the Finance Module
 * Includes Browser Canvas Compression and jsPDF Finance Ledger Export
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Browser Image Compression ──────────────────────────────
/**
 * Compresses an image file (PNG/JPG) using HTML5 Canvas
 * Output is always image/jpeg at 75% quality and maximum 1200px dimension
 */
export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Failsafe: if file is already very small or reader fails, fallback to original
    if (file.size <= 100 * 1024) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 1200;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback to raw file if canvas fails
        }

        // Draw image on white canvas background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to raw file
            }
          },
          'image/jpeg',
          0.75 // 75% quality
        );
      };
      img.onerror = () => resolve(file); // Fallback on image loading error
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file); // Fallback on reader error
    reader.readAsDataURL(file);
  });
};

// ─── Custom Premium jsPDF Ledger Export ─────────────────────
export interface FinanceReportData {
  orgName: string;
  orgRut?: string;
  orgType?: string;
  logoUrl?: string;
  address?: string;
  villa?: string;
  commune?: string;
  periodYear: number;
  dateRangeText: string;
  // Metrics
  initialBank: number;
  initialCash: number;
  totalIncomeBank: number;
  totalIncomeCash: number;
  totalExpenseBank: number;
  totalExpenseCash: number;
  finalBank: number;
  finalCash: number;
  // Categories summaries
  categorySummaries: { name: string; type: 'income' | 'expense'; amount: number }[];
  // Transactions
  transactions: {
    date: string;
    description: string;
    category: string;
    method: string;
    type: string;
    amount: number;
    hasReceipt: boolean;
  }[];
  // Signatures
  signatures?: {
    president: { name: string; title: string; enabled: boolean };
    secretary: { name: string; title: string; enabled: boolean };
  };
}

export const exportFinanceReportToPDF = async (data: FinanceReportData): Promise<boolean> => {
  try {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper to format currency in Chilean Pesos
    const formatCLP = (val: number) => `$${Math.round(val).toLocaleString('es-CL')}`;

    // ─── Header: Organization Membrane ───
    pdf.setFillColor(99, 102, 241); // Brand Indigo
    pdf.rect(margin, y, contentWidth, 1.5, 'F');
    y += 6;

    // Org Logo
    if (data.logoUrl) {
      try {
        const logoSize = 18;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = data.logoUrl!;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', pageWidth - margin - logoSize, y - 2, logoSize, logoSize);
      } catch (e) {
        console.warn("Could not insert logo in PDF", e);
      }
    }

    // Org Details
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text(data.orgName.toUpperCase(), margin, y);
    y += 5;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    if (data.orgRut) {
      pdf.text(`RUT: ${data.orgRut}`, margin, y);
      y += 4;
    }
    const location = [data.address, data.villa, data.commune].filter(Boolean).join(', ');
    if (location) {
      pdf.text(location, margin, y);
      y += 4;
    }
    pdf.text(`Tipo de Org: ${data.orgType === 'jjvv' ? 'Junta de Vecinos' : 'Organización Comunitaria'}`, margin, y);
    y += 8;

    // Report Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text('INFORME CONSOLIDADO DE RENDICIÓN DE CUENTAS', margin, y);
    y += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(`${data.dateRangeText} • Ejercicio Contable: ${data.periodYear}`, margin, y);
    y += 6;

    // Divider Line
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;

    // ─── Section A: Balance Summary Cards ───
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text('1. RESUMEN DE SALDOS Y CONCILIACIÓN', margin, y);
    y += 5;

    const cards = [
      { label: 'SALDO INICIAL TOTAL', val: data.initialBank + data.initialCash },
      { label: 'INGRESOS REGISTRADOS', val: data.totalIncomeBank + data.totalIncomeCash },
      { label: 'EGRESOS REGISTRADOS', val: data.totalExpenseBank + data.totalExpenseCash },
      { label: 'SALDO NETO ACTUAL', val: data.finalBank + data.finalCash }
    ];

    const cardW = (contentWidth - 9) / 4;
    cards.forEach((card, i) => {
      const x = margin + i * (cardW + 3);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(x, y, cardW, 15, 2, 2, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(x, y, cardW, 15, 2, 2, 'S');

      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 116, 139);
      pdf.text(card.label, x + 3, y + 5);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(i === 2 ? 220 : i === 1 ? 22 : 15, i === 2 ? 38 : i === 1 ? 163 : 23, i === 2 ? 38 : i === 1 ? 74 : 42); // Green for Income, Red for Expense
      pdf.text(formatCLP(card.val), x + 3, y + 11);
    });
    y += 21;

    // Bank vs Cash Sub-ledger Table
    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Cuenta', 'Saldo Inicial', 'Total Ingresos', 'Total Egresos', 'Saldo Final Actual']],
      body: [
        ['Cuenta Bancaria', formatCLP(data.initialBank), formatCLP(data.totalIncomeBank), formatCLP(data.totalExpenseBank), formatCLP(data.finalBank)],
        ['Caja Efectivo (Caja Chica)', formatCLP(data.initialCash), formatCLP(data.totalIncomeCash), formatCLP(data.totalExpenseCash), formatCLP(data.finalCash)],
        ['TOTAL CONSOLIDADO', formatCLP(data.initialBank + data.initialCash), formatCLP(data.totalIncomeBank + data.totalIncomeCash), formatCLP(data.totalExpenseBank + data.totalExpenseCash), formatCLP(data.finalBank + data.finalCash)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (cellData) => {
        if (cellData.row.index === 2) {
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    y = (pdf as any).lastAutoTable.finalY + 8;

    // ─── Section B: Category Summaries ───
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text('2. RESUMEN POR CATEGORÍAS', margin, y);
    y += 4;

    const expensesSum = data.categorySummaries.filter(c => c.type === 'expense');
    const incomesSum = data.categorySummaries.filter(c => c.type === 'income');

    const sumTableBody = [];
    const maxLen = Math.max(expensesSum.length, incomesSum.length);
    for (let i = 0; i < maxLen; i++) {
      const inc = incomesSum[i];
      const exp = expensesSum[i];
      sumTableBody.push([
        inc ? inc.name : '',
        inc ? formatCLP(inc.amount) : '',
        exp ? exp.name : '',
        exp ? formatCLP(exp.amount) : ''
      ]);
    }

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Categoría de Ingreso', 'Monto', 'Categoría de Gasto', 'Monto']],
      body: sumTableBody,
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
      columnStyles: {
        1: { halign: 'right', textColor: [22, 101, 52] },
        3: { halign: 'right', textColor: [153, 27, 27] }
      }
    });

    y = (pdf as any).lastAutoTable.finalY + 8;

    // ─── Section C: Full Ledger Ledger ───
    // Check if we need to start a new page
    if (y > pageHeight - 60) {
      addReportFooter(pdf, pageWidth, pageHeight, margin, data.orgName);
      pdf.addPage();
      y = margin + 5;
    }

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text('3. DETALLE DE MOVIMIENTOS CONTABLES', margin, y);
    y += 4;

    const transactionRows = data.transactions.map((t, idx) => [
      t.date,
      t.description,
      t.category,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.method === 'bank' ? 'Banco' : 'Efectivo',
      t.type === 'income' ? `+${formatCLP(t.amount)}` : `-${formatCLP(t.amount)}`,
      t.hasReceipt ? 'Sí' : 'No'
    ]);

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Fecha', 'Descripción / Detalle', 'Categoría', 'Tipo', 'Medio', 'Monto', 'Boleta']],
      body: transactionRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'center' }
      },
      didParseCell: (cellData) => {
        if (cellData.column.index === 5 && cellData.cell.raw) {
          const text = cellData.cell.raw as string;
          if (text.startsWith('+')) {
            cellData.cell.styles.textColor = [22, 101, 52];
          } else if (text.startsWith('-')) {
            cellData.cell.styles.textColor = [153, 27, 27];
          }
        }
      }
    });

    y = (pdf as any).lastAutoTable.finalY + 12;

    // ─── Signatures Block ───
    if (data.signatures && (data.signatures.president.enabled || data.signatures.secretary.enabled)) {
      const sigHeight = 25;
      if (y + sigHeight > pageHeight - margin) {
        addReportFooter(pdf, pageWidth, pageHeight, margin, data.orgName);
        pdf.addPage();
        y = margin + 15;
      }

      const sigBlockW = contentWidth / 2.5;

      // President Signature on Left
      if (data.signatures.president.enabled) {
        const x = margin + 5;
        pdf.setDrawColor(148, 163, 184);
        pdf.line(x, y + 12, x + sigBlockW, y + 12);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text(data.signatures.president.name || '_________________________', x + sigBlockW / 2, y + 16, { align: 'center' });
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text(data.signatures.president.title, x + sigBlockW / 2, y + 20, { align: 'center' });
      }

      // Secretary Signature on Right
      if (data.signatures.secretary.enabled) {
        const x = pageWidth - margin - sigBlockW - 5;
        pdf.setDrawColor(148, 163, 184);
        pdf.line(x, y + 12, x + sigBlockW, y + 12);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text(data.signatures.secretary.name || '_________________________', x + sigBlockW / 2, y + 16, { align: 'center' });

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text(data.signatures.secretary.title, x + sigBlockW / 2, y + 20, { align: 'center' });
      }
    }

    addReportFooter(pdf, pageWidth, pageHeight, margin, data.orgName);
    pdf.save(`Balance_Finanzas_${data.periodYear}_${Date.now()}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating custom financial report PDF:', err);
    return false;
  }
};

const addReportFooter = (
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  orgName: string
) => {
  const footerY = pageHeight - margin + 2;
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Rendición Oficial de Cuentas — ${orgName}`, margin, footerY);
  
  const pageCountStr = (pdf as any).internal.getNumberOfPages();
  pdf.text(`Pág. ${pageCountStr}`, pageWidth - margin, footerY, { align: 'right' });

  pdf.setFillColor(99, 102, 241);
  pdf.rect(margin, footerY + 2, pageWidth - margin * 2, 0.4, 'F');
};
