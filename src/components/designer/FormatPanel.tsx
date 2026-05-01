'use client';

import {
  PaperFormat,
  PaperSize,
  Orientation,
  PAPER_SIZES,
} from '@/lib/cardDesignTypes';
import {
  FileText,
  Smartphone,
  Monitor,
  Download,
} from 'lucide-react';

interface FormatPanelProps {
  format: PaperFormat;
  cardWidth: number;
  cardHeight: number;
  onUpdateFormat: (format: PaperFormat) => void;
  onUpdateDimensions: (width: number, height: number) => void;
  onExportPDF: () => void;
}

export function FormatPanel({
  format,
  cardWidth,
  cardHeight,
  onUpdateFormat,
  onUpdateDimensions,
  onExportPDF,
}: FormatPanelProps) {

  const handlePaperSizeChange = (paperSize: PaperSize) => {
    const paper = PAPER_SIZES.find((p) => p.key === paperSize);
    if (!paper) return;

    const newFormat: PaperFormat = { ...format, paperSize };

    // Calculate pixel dimensions from mm (at ~2px per mm for screen)
    const pxPerMm = 2;
    if (paperSize === 'custom') {
      onUpdateFormat(newFormat);
      return;
    }

    let w: number, h: number;
    if (newFormat.orientation === 'horizontal') {
      w = Math.round(paper.widthMm * pxPerMm);
      h = Math.round(paper.heightMm * pxPerMm);
    } else {
      w = Math.round(paper.heightMm * pxPerMm);
      h = Math.round(paper.widthMm * pxPerMm);
    }

    onUpdateFormat(newFormat);
    onUpdateDimensions(w, h);
  };

  const handleOrientationChange = (orientation: Orientation) => {
    const newFormat: PaperFormat = { ...format, orientation };
    onUpdateFormat(newFormat);

    // Swap width and height
    if (
      (orientation === 'horizontal' && cardWidth < cardHeight) ||
      (orientation === 'vertical' && cardWidth > cardHeight)
    ) {
      onUpdateDimensions(cardHeight, cardWidth);
    }
  };

  const selectedPaper = PAPER_SIZES.find((p) => p.key === format.paperSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-400" />
          Formato
        </h4>
        <p className="text-xs text-slate-500">
          Elige el tamaño del papel y la orientación de tu credencial.
        </p>
      </div>

      {/* Paper Size */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 font-mono">
          TAMAÑO DEL PAPEL
        </h4>
        <select
          value={format.paperSize}
          onChange={(e) => handlePaperSizeChange(e.target.value as PaperSize)}
          className="glass-input w-full px-4 py-2.5 text-sm"
        >
          {PAPER_SIZES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label} ({p.widthMm} x {p.heightMm} cm)
            </option>
          ))}
        </select>

        {selectedPaper && format.paperSize !== 'custom' && (
          <p className="text-[10px] text-brand-400/80 mt-2 font-mono font-bold tracking-tight">
            {format.orientation === 'horizontal'
              ? `DIM: ${selectedPaper.widthMm} × ${selectedPaper.heightMm} MM`
              : `DIM: ${selectedPaper.heightMm} × ${selectedPaper.widthMm} MM`
            } — {cardWidth} × {cardHeight} PX
          </p>
        )}
      </div>

      {/* Custom dimensions */}
      {format.paperSize === 'custom' && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 font-mono">
            DIMENSIONES PERSONALIZADAS (PX)
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block font-mono">Ancho</label>
              <input
                type="number"
                min={200}
                max={1400}
                value={cardWidth}
                onChange={(e) => onUpdateDimensions(Number(e.target.value), cardHeight)}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block font-mono">Alto</label>
              <input
                type="number"
                min={150}
                max={1000}
                value={cardHeight}
                onChange={(e) => onUpdateDimensions(cardWidth, Number(e.target.value))}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Orientation */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 font-mono">
          ORIENTACIÓN
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {/* Horizontal */}
          <button
            onClick={() => handleOrientationChange('horizontal')}
            className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
              format.orientation === 'horizontal'
                ? 'bg-brand-500/10 border-brand-400 text-white shadow-lg shadow-brand-500/10'
                : 'bg-surface-900/30 border-brand-500/10 text-slate-400 hover:border-brand-500/25 hover:bg-surface-900/50'
            }`}
          >
            <Monitor className={`w-7 h-5 ${format.orientation === 'horizontal' ? 'text-brand-400' : 'text-slate-600'}`} />
            <div className="text-center">
              <p className={`text-[10px] font-bold uppercase tracking-widest font-mono ${format.orientation === 'horizontal' ? 'text-white' : 'text-slate-500'}`}>
                HORIZONTAL
              </p>
              <p className="text-[9px] text-slate-600 mt-0.5 font-mono">LANDSCAPE</p>
            </div>
          </button>

          {/* Vertical */}
          <button
            onClick={() => handleOrientationChange('vertical')}
            className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
              format.orientation === 'vertical'
                ? 'bg-brand-500/10 border-brand-400 text-white shadow-lg shadow-brand-500/10'
                : 'bg-surface-900/30 border-brand-500/10 text-slate-400 hover:border-brand-500/25 hover:bg-surface-900/50'
            }`}
          >
            <Smartphone className={`w-5 h-7 ${format.orientation === 'vertical' ? 'text-brand-400' : 'text-slate-600'}`} />
            <div className="text-center">
              <p className={`text-[10px] font-bold uppercase tracking-widest font-mono ${format.orientation === 'vertical' ? 'text-white' : 'text-slate-500'}`}>
                VERTICAL
              </p>
              <p className="text-[9px] text-slate-600 mt-0.5 font-mono">PORTRAIT</p>
            </div>
          </button>
        </div>
      </div>

      {/* Current size preview */}
      <div className="bg-surface-900/30 rounded-xl p-4 border border-brand-500/10">
        <h4 className="text-xs font-semibold text-slate-400 mb-3">Vista previa del formato</h4>
        <div className="flex items-center justify-center">
          <div
            className="border-2 border-brand-400/30 rounded-lg bg-brand-500/5 transition-all duration-300 flex items-center justify-center"
            style={{
              width: format.orientation === 'horizontal' ? '120px' : '80px',
              height: format.orientation === 'horizontal' ? '80px' : '120px',
            }}
          >
            <span className="text-[9px] text-brand-300/60 font-mono">
              {cardWidth}×{cardHeight}
            </span>
          </div>
        </div>
      </div>

      {/* Export PDF */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Exportar
        </h4>
        <button
          onClick={onExportPDF}
          className="w-full flex items-center justify-center gap-2.5 p-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
        <p className="text-[10px] text-slate-500 mt-1.5 text-center">
          La credencial se exportará como PDF usando el formato seleccionado
        </p>
      </div>

      {/* Help */}
      <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-3">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          <span className="text-brand-300 font-semibold">Tip:</span> Mantén presionada la tecla
          <kbd className="mx-1 px-1.5 py-0.5 bg-surface-900 rounded text-brand-300 border border-brand-500/20 text-[9px] font-mono">Ctrl</kbd>
          y arrastra cualquier elemento sobre la tarjeta para reposicionarlo libremente.
        </p>
      </div>
    </div>
  );
}
