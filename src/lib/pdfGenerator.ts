/**
 * PDF Generation Utility - Centralized PDF creation for all modules
 * Uses html2canvas + jsPDF for visual renders and jsPDF tables for reports
 */

// ─── Types ─────────────────────────────────────────────────
export interface PDFOptions {
  filename: string;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'a4' | 'letter' | 'legal' | 'a5';
  quality?: number; // 0 to 1
  scale?: number;   // render scale (higher = better quality, slower)
  margin?: number;  // mm
}

export interface ReportColumn {
  header: string;
  key: string;
  width?: number; // percentage
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown) => string;
}

export interface ReportOptions extends PDFOptions {
  title: string;
  subtitle?: string;
  orgName?: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  summary?: { label: string; value: string }[];
  dateRange?: { start: string; end: string };
  logoUrl?: string;
  footerSummary?: { type: string; count: number; total: number }[];
}

// ─── Helpers ───────────────────────────────────────────────
const getPaperFormat = (size: string) => {
  const map: Record<string, string> = {
    carta: 'letter', a4: 'a4', oficio: 'legal', a5: 'a5', letter: 'letter', legal: 'legal'
  };
  return map[size] || 'a4';
};

const formatDateCL = (date: Date) => {
  return date.toLocaleDateString('es-CL', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
};

// ─── Canvas Element → PDF ──────────────────────────────────
/**
 * Captures an HTML element (like CanvasPreview) and exports it as a PDF.
 * Used for: Certificates, Cards, Editor exports
 */
export async function exportElementToPDF(
  elementId: string,
  options: PDFOptions
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  try {
    const htmlToImage = await import('html-to-image');
    const { jsPDF } = await import('jspdf');

    const scale = options.scale || 3;
    const margin = options.margin ?? 10;

    // Use html-to-image which handles modern CSS and SVGs much better than html2canvas
    const imgData = await htmlToImage.toPng(element, {
      pixelRatio: scale,
      backgroundColor: '#ffffff',
      filter: (el) => {
        if (el.classList && el.classList.contains('no-export')) return false;
        return true;
      },
      // Using cacheBust helps avoid some stale CORS issues locally
      cacheBust: true,
    });
    const orientation = options.orientation || 'portrait';
    const paperFormat = getPaperFormat(options.paperSize || 'a4');

    const pdf = new jsPDF({ orientation, unit: 'mm', format: paperFormat });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const availW = pageWidth - margin * 2;
    const availH = pageHeight - margin * 2;

    const imgAspect = element.offsetWidth / element.offsetHeight;
    let drawW = availW;
    let drawH = drawW / imgAspect;

    if (drawH > availH) {
      drawH = availH;
      drawW = drawH * imgAspect;
    }

    const offsetX = margin + (availW - drawW) / 2;
    const offsetY = margin + (availH - drawH) / 2;

    pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);
    pdf.save(`${options.filename}.pdf`);
    return true;
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    return false;
  }
}

// ─── Table Report → PDF ────────────────────────────────────
/**
 * Generates a professional tabular report PDF.
 * Used for: Certificate reports, Beneficiary exports, Attendance reports
 */
export async function exportReportToPDF(options: ReportOptions): Promise<boolean> {
  try {
    const { jsPDF } = await import('jspdf');
    const orientation = options.orientation || 'landscape';
    const paperFormat = getPaperFormat(options.paperSize || 'a4');
    const margin = options.margin ?? 15;

    const pdf = new jsPDF({ orientation, unit: 'mm', format: paperFormat });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;

    let y = margin;

    // ── Header ──
    // Brand line
    pdf.setFillColor(99, 102, 241); // brand-500
    pdf.rect(margin, y, contentWidth, 1.5, 'F');
    y += 6;

    // Logo on the right
    if (options.logoUrl) {
      try {
        const logoSize = 15;
        pdf.addImage(options.logoUrl, 'PNG', pageWidth - margin - logoSize, y - 4, logoSize, logoSize);
      } catch (err) {
        console.warn('Could not add logo to PDF:', err);
      }
    }

    // Organization name
    if (options.orgName) {
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 140);
      pdf.text(options.orgName.toUpperCase(), margin, y);
      y += 8; // Increased spacing
    }

    // Title
    pdf.setFontSize(18);
    pdf.setTextColor(30, 30, 50);
    pdf.setFont('helvetica', 'bold');
    pdf.text(options.title, margin, y);
    y += 8;

    // Subtitle / Date
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 140);
    pdf.setFont('helvetica', 'normal');
    
    // Format date range if provided in YYYY-MM-DD
    let dateRangeText = '';
    if (options.dateRange) {
      const formatInputDate = (dStr: string) => {
        if (!dStr) return '-';
        if (dStr.includes('-') && dStr.length === 10) {
          const [y, m, d] = dStr.split('-');
          return `${d}-${m}-${y}`;
        }
        return dStr;
      };
      dateRangeText = `Período: ${formatInputDate(options.dateRange.start)} — ${formatInputDate(options.dateRange.end)}`;
    }

    const dateText = options.dateRange 
      ? dateRangeText
      : `Generado: ${formatDateTimeCL(new Date())}`;
    pdf.text(options.subtitle ? `${options.subtitle} • ${dateText}` : dateText, margin, y);
    y += 10;

    // Separator
    pdf.setDrawColor(220, 220, 230);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;

    // ── Summary cards ──
    if (options.summary && options.summary.length > 0) {
      const cardW = Math.min((contentWidth - (options.summary.length - 1) * 4) / options.summary.length, 60);
      
      options.summary.forEach((item, i) => {
        const x = margin + i * (cardW + 4);
        // Card background
        pdf.setFillColor(245, 245, 250);
        pdf.roundedRect(x, y, cardW, 16, 2, 2, 'F');
        // Label
        pdf.setFontSize(7);
        pdf.setTextColor(120, 120, 140);
        pdf.text(item.label.toUpperCase(), x + 4, y + 6);
        // Value
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 50);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.value, x + 4, y + 13);
        pdf.setFont('helvetica', 'normal');
      });
      y += 22;
    }

    // ── Table ──
    const colWidths = options.columns.map(col => {
      if (col.width) return (col.width / 100) * contentWidth;
      return contentWidth / options.columns.length;
    });

    // Table header
    pdf.setFillColor(30, 30, 50);
    pdf.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');
    
    let xPos = margin;
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    
    options.columns.forEach((col, i) => {
      const textX = col.align === 'right' 
        ? xPos + colWidths[i] - 3
        : col.align === 'center' 
          ? xPos + colWidths[i] / 2 
          : xPos + 3;
      const align = col.align || 'left';
      pdf.text(col.header.toUpperCase(), textX, y + 5.5, { align });
      xPos += colWidths[i];
    });
    y += 10;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    const rowHeight = 7;
    const maxY = pageHeight - margin - 15; // Reserve space for footer

    options.data.forEach((row, rowIndex) => {
      // Check for page break
      if (y + rowHeight > maxY) {
        // Footer on current page
        addPageFooter(pdf, pageWidth, pageHeight, margin, options.orgName || '');
        pdf.addPage();
        y = margin + 5;
        
        // Repeat header on new page
        pdf.setFillColor(30, 30, 50);
        pdf.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');
        xPos = margin;
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        options.columns.forEach((col, i) => {
          const textX = col.align === 'right' 
            ? xPos + colWidths[i] - 3
            : col.align === 'center' 
              ? xPos + colWidths[i] / 2 
              : xPos + 3;
          pdf.text(col.header.toUpperCase(), textX, y + 5.5, { align: col.align || 'left' });
          xPos += colWidths[i];
        });
        y += 10;
        pdf.setFont('helvetica', 'normal');
      }

      // Zebra striping
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(248, 248, 252);
        pdf.rect(margin, y - 1, contentWidth, rowHeight, 'F');
      }

      xPos = margin;
      pdf.setFontSize(8);
      pdf.setTextColor(50, 50, 70);
      
      options.columns.forEach((col, i) => {
        const rawVal = row[col.key];
        const val = col.format ? col.format(rawVal) : String(rawVal ?? '');
        const textX = col.align === 'right' 
          ? xPos + colWidths[i] - 3
          : col.align === 'center' 
            ? xPos + colWidths[i] / 2 
            : xPos + 3;
        // Truncate text if too long
        const maxChars = Math.floor(colWidths[i] / 2);
        const truncated = val.length > maxChars ? val.substring(0, maxChars - 2) + '...' : val;
        pdf.text(truncated, textX, y + 4, { align: col.align || 'left' });
        xPos += colWidths[i];
      });

      y += rowHeight;
    });

    // ── Footer Summary ──
    if (options.footerSummary && options.footerSummary.length > 0) {
      // Check if we need a new page for the summary
      if (y + 40 > pageHeight - margin) {
        addPageFooter(pdf, pageWidth, pageHeight, margin, options.orgName || '');
        pdf.addPage();
        y = margin + 10;
      } else {
        y += 15;
      }
      
      pdf.setFontSize(11);
      pdf.setTextColor(30, 30, 50);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMEN DE RECAUDACIÓN POR TIPO', margin, y);
      y += 5;

      const { default: autoTable } = await import('jspdf-autotable');
      (autoTable as any)(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Tipo de Certificado', 'Cantidad', 'Monto Recaudado']],
        body: options.footerSummary.map(item => [
          item.type,
          item.count.toString(),
          `$${item.total.toLocaleString('es-CL')}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [50, 50, 70], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' }
        }
      });
    }

    // Bottom line
    pdf.setDrawColor(220, 220, 230);
    pdf.line(margin, pageHeight - margin - 2, pageWidth - margin, pageHeight - margin - 2);

    // Footer
    addPageFooter(pdf, pageWidth, pageHeight, margin, options.orgName || '');

    pdf.save(`${options.filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating report PDF:', err);
    return false;
  }
}

function addPageFooter(
  pdf: import('jspdf').jsPDF, 
  pageWidth: number, 
  pageHeight: number, 
  margin: number, 
  orgName: string
) {
  const footerY = pageHeight - margin;
  pdf.setFontSize(7);
  pdf.setTextColor(160, 160, 180);
  pdf.text(`${orgName} — Generado por SkardKey`, margin, footerY);
  pdf.text(formatDateCL(new Date()), pageWidth - margin, footerY, { align: 'right' });
  
  // Brand accent
  pdf.setFillColor(99, 102, 241);
  pdf.rect(margin, footerY + 2, pageWidth - margin * 2, 0.5, 'F');
}
