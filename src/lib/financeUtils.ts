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
  // Metrics (excluding transfers)
  initialBank: number;
  initialCash: number;
  totalIncomeBank: number;
  totalIncomeCash: number;
  totalExpenseBank: number;
  totalExpenseCash: number;
  // Transfer amounts (net effect per account)
  transferBank: number;
  transferCash: number;
  finalBank: number;
  finalCash: number;
  // Categories summaries (already filtered, no transfers)
  categorySummaries: { name: string; type: 'income' | 'expense'; amount: number }[];
  // Transactions (all, including transfers for audit trail)
  transactions: {
    date: string;
    description: string;
    category: string;
    method: string;
    type: string;
    amount: number;
    hasReceipt: boolean;
    receiptNumber?: string;
  }[];
  // Signatures
  signatures?: {
    president: { name: string; title: string; enabled: boolean };
    secretary: { name: string; title: string; enabled: boolean };
    treasurer: { name: string; title: string; enabled: boolean };
    reviewCommittee: { name: string; title: string; enabled: boolean };
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

    // ─── Section 1: Balance Summary Cards ───
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text('1. RESUMEN DE SALDOS Y CONCILIACIÓN', margin, y);
    y += 5;

    // Cards use pure income/expense (no transfers)
    const totalIncome = data.totalIncomeBank + data.totalIncomeCash;
    const totalExpense = data.totalExpenseBank + data.totalExpenseCash;

    const cards = [
      { label: 'SALDO INICIAL TOTAL', val: data.initialBank + data.initialCash },
      { label: 'INGRESOS REGISTRADOS', val: totalIncome },
      { label: 'EGRESOS REGISTRADOS', val: totalExpense },
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
      pdf.text(card.label, x + cardW / 2, y + 5, { align: 'center' });

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(i === 2 ? 220 : i === 1 ? 22 : 15, i === 2 ? 38 : i === 1 ? 163 : 23, i === 2 ? 38 : i === 1 ? 74 : 42);
      pdf.text(formatCLP(card.val), x + cardW / 2, y + 11, { align: 'center' });
    });
    y += 21;

    // ─── Bank vs Cash Sub-ledger Table WITH Traspaso column ───
    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Cuenta', 'Saldo Inicial', 'Total Ingresos', 'Traspaso', 'Total Egresos', 'Saldo Final Actual']],
      body: [
        [
          'Cuenta Bancaria',
          formatCLP(data.initialBank),
          formatCLP(data.totalIncomeBank),
          formatCLP(data.transferBank),
          formatCLP(data.totalExpenseBank),
          formatCLP(data.finalBank)
        ],
        [
          'Caja Efectivo (Caja Chica)',
          formatCLP(data.initialCash),
          formatCLP(data.totalIncomeCash),
          formatCLP(data.transferCash),
          formatCLP(data.totalExpenseCash),
          formatCLP(data.finalCash)
        ],
        [
          'TOTAL CONSOLIDADO',
          formatCLP(data.initialBank + data.initialCash),
          formatCLP(data.totalIncomeBank + data.totalIncomeCash),
          formatCLP(data.transferBank + data.transferCash),
          formatCLP(data.totalExpenseBank + data.totalExpenseCash),
          formatCLP(data.finalBank + data.finalCash)
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (cellData) => {
        // Align headers to the right for numeric columns
        if (cellData.section === 'head' && cellData.column.index > 0) {
          cellData.cell.styles.halign = 'right';
        }
        // Bold the TOTAL row
        if (cellData.section === 'body' && cellData.row.index === 2) {
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.fillColor = [241, 245, 249];
        }
        // Color the Traspaso column (index 3)
        if (cellData.column.index === 3 && cellData.section === 'body') {
          const rawText = cellData.cell.raw as string;
          if (rawText && rawText.includes('-')) {
            cellData.cell.styles.textColor = [153, 27, 27]; // Red for negative
          } else if (rawText && rawText !== '$0') {
            cellData.cell.styles.textColor = [22, 101, 52]; // Green for positive
          } else {
            cellData.cell.styles.textColor = [100, 116, 139]; // Grey for zero
          }
        }
      }
    });

    y = (pdf as any).lastAutoTable.finalY + 8;

    // ─── Section 2: Category Summaries (NO Traspaso Interno) ───
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text('2. RESUMEN POR CATEGORÍAS', margin, y);
    y += 4;

    // Filter out Traspaso Interno from categories
    const expensesSum = data.categorySummaries.filter(c => c.type === 'expense' && !c.name.toLowerCase().includes('traspaso'));
    const incomesSum = data.categorySummaries.filter(c => c.type === 'income' && !c.name.toLowerCase().includes('traspaso'));

    const totalIncomeCategories = incomesSum.reduce((s, c) => s + c.amount, 0);
    const totalExpenseCategories = expensesSum.reduce((s, c) => s + c.amount, 0);

    const sumTableBody: string[][] = [];
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

    // Add totals row
    sumTableBody.push([
      'TOTAL INGRESOS',
      formatCLP(totalIncomeCategories),
      'TOTAL EGRESOS',
      formatCLP(totalExpenseCategories)
    ]);

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
      },
      didParseCell: (cellData) => {
        // Align Monto headers to the right
        if (cellData.section === 'head' && (cellData.column.index === 1 || cellData.column.index === 3)) {
          cellData.cell.styles.halign = 'right';
        }
        // Bold the totals row (last row)
        if (cellData.section === 'body' && cellData.row.index === sumTableBody.length - 1) {
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    y = (pdf as any).lastAutoTable.finalY + 8;

    // ─── Section 3: Full Transaction Ledger ───
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

    // Calculate totals for the footer row
    let totalIngresosLedger = 0;
    let totalEgresosLedger = 0;
    let totalTraspasosLedger = 0;

    const transactionRows = data.transactions.map((t) => {
      const isTransfer = t.category.toLowerCase().includes('traspaso');

      if (isTransfer) {
        totalTraspasosLedger += t.amount;
      } else if (t.type === 'income') {
        totalIngresosLedger += t.amount;
      } else if (t.type === 'expense') {
        totalEgresosLedger += t.amount;
      }

      return [
        t.date,
        t.receiptNumber || '-',
        t.description,
        t.category,
        isTransfer ? 'Traspaso' : t.type === 'income' ? 'Ingreso' : 'Gasto',
        isTransfer ? (t.method === 'bank' ? 'Banco a Caja' : 'Caja a Banco') : t.method === 'bank' ? 'Banco' : 'Efectivo',
        isTransfer
          ? formatCLP(t.amount)
          : t.type === 'expense'
            ? `-${formatCLP(t.amount)}`
            : `+${formatCLP(t.amount)}`,
        t.hasReceipt ? 'Sí' : 'No'
      ];
    });

    // Add totals row with a single net total
    const netTotal = totalIngresosLedger - totalEgresosLedger;
    transactionRows.push([
      '', '', '', '',
      'TOTALES',
      '',
      `${netTotal >= 0 ? '+' : '-'}${formatCLP(Math.abs(netTotal))}`,
      ''
    ]);

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Fecha', 'Nro Doc', 'Descripción', 'Categoría', 'Tipo', 'Medio', 'Monto', 'Boleta']],
      body: transactionRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 7.5 },
      bodyStyles: { fontSize: 6.5, textColor: [30, 41, 59] },
      columnStyles: {
        6: { halign: 'right', fontStyle: 'bold' },
        7: { halign: 'center' }
      },
      didParseCell: (cellData) => {
        // Totals row (last row)
        if (cellData.row.index === transactionRows.length - 1) {
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.fillColor = [241, 245, 249];
          cellData.cell.styles.textColor = [15, 23, 42];
          return;
        }

        // Color the amount column
        if (cellData.column.index === 6 && cellData.cell.raw) {
          const text = cellData.cell.raw as string;
          if (text.startsWith('+')) {
            cellData.cell.styles.textColor = [22, 101, 52];
          } else if (text.startsWith('-')) {
            cellData.cell.styles.textColor = [153, 27, 27];
          } else {
            cellData.cell.styles.textColor = [99, 102, 241]; // brand for transfer
          }
        }
      }
    });

    y = (pdf as any).lastAutoTable.finalY + 12;

    // ─── Signatures Block (4 signatures in 2 rows + Fecha de Revisión) ───
    const sigBlockW = (contentWidth - 20) / 2;
    const sigHeight = 30;

    // Check if we need a new page for signatures
    if (y + sigHeight * 2 + 20 > pageHeight - margin) {
      addReportFooter(pdf, pageWidth, pageHeight, margin, data.orgName);
      pdf.addPage();
      y = margin + 15;
    }

    // Divider before signatures
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Row 1: President + Secretary
    const renderSignatureBlock = (x: number, currentY: number, name: string, title: string) => {
      pdf.setDrawColor(148, 163, 184);
      pdf.line(x, currentY + 12, x + sigBlockW, currentY + 12);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      
      const names = name ? name.split(/,|\n/).map(n => n.trim()).filter(Boolean) : ['_________________________'];
      
      names.forEach((n, idx) => {
        pdf.text(n, x + sigBlockW / 2, currentY + 16 + (idx * 4), { align: 'center' });
      });

      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(title, x + sigBlockW / 2, currentY + 16 + (names.length * 4), { align: 'center' });
    };

    // Row 1: Presidente + Secretario
    if (data.signatures) {
      if (data.signatures.president.enabled) {
        renderSignatureBlock(margin + 5, y, data.signatures.president.name, data.signatures.president.title);
      }
      if (data.signatures.secretary.enabled) {
        renderSignatureBlock(pageWidth - margin - sigBlockW - 5, y, data.signatures.secretary.name, data.signatures.secretary.title);
      }
    }
    y += sigHeight;

    // Row 2: Tesorero + Comisión Revisora
    if (data.signatures) {
      if (data.signatures.treasurer?.enabled) {
        renderSignatureBlock(margin + 5, y, data.signatures.treasurer.name, data.signatures.treasurer.title);
      }
      if (data.signatures.reviewCommittee?.enabled) {
        renderSignatureBlock(pageWidth - margin - sigBlockW - 5, y, data.signatures.reviewCommittee.name, data.signatures.reviewCommittee.title);
      }
    }
    y += sigHeight;

    // Fecha de Revisión (blank line for manual entry)
    y += 4;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text('Fecha de Revisión: _____________________________', margin + 5, y);

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
