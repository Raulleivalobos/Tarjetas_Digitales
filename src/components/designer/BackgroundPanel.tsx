'use client';

import { CardBackground, BACKGROUND_PRESETS } from '@/lib/cardDesignTypes';
import { Paintbrush, Upload, Palette, ImageIcon, AlertTriangle, X } from 'lucide-react';
import { useRef, useState } from 'react';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png';

interface BackgroundPanelProps {
  background: CardBackground;
  onUpdateBackground: (bg: CardBackground) => void;
}

export function BackgroundPanel({ background, onUpdateBackground }: BackgroundPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Formato no soportado. Solo se aceptan archivos JPG y PNG.');
      e.target.value = '';
      return;
    }
    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`El archivo pesa ${sizeMB} MB. El tamaño máximo permitido es ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = '';
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      onUpdateBackground({
        type: 'image',
        imageUrl: result,
        imageOpacity: 1,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Paintbrush className="w-4 h-4 text-brand-400" />
          Fondo
        </h4>
        <p className="text-xs text-slate-500">
          Personaliza el fondo de tu tarjeta/credencial.
        </p>
      </div>

      {/* Background type selector */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Tipo de fondo
        </h4>
        <div className="grid grid-cols-3 gap-1.5">
          {(['solid', 'gradient', 'image'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                if (type === 'solid') {
                  onUpdateBackground({ type: 'solid', color: background.color || '#0f172a' });
                } else if (type === 'gradient') {
                  onUpdateBackground({
                    type: 'gradient',
                    gradientStart: background.gradientStart || '#1e293b',
                    gradientEnd: background.gradientEnd || '#0f172a',
                    gradientAngle: background.gradientAngle || 135,
                  });
                } else {
                  onUpdateBackground({
                    type: 'image',
                    imageUrl: background.imageUrl || '',
                    imageOpacity: background.imageOpacity ?? 1,
                  });
                }
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                background.type === type
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'bg-surface-900/50 text-slate-400 border border-transparent hover:bg-brand-500/10'
              }`}
            >
              {type === 'solid' ? 'Sólido' : type === 'gradient' ? 'Gradiente' : 'Imagen'}
            </button>
          ))}
        </div>
      </div>

      {/* Solid Color */}
      {background.type === 'solid' && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Color de fondo
          </h4>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={background.color || '#0f172a'}
              onChange={(e) => onUpdateBackground({ ...background, color: e.target.value })}
              className="w-10 h-10 rounded-xl border-2 border-brand-500/20 cursor-pointer"
            />
            <input
              type="text"
              value={background.color || '#0f172a'}
              onChange={(e) => onUpdateBackground({ ...background, color: e.target.value })}
              className="glass-input flex-1 px-3 py-2 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {/* Gradient */}
      {background.type === 'gradient' && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Colores del gradiente
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 w-12">Inicio</label>
              <input
                type="color"
                value={background.gradientStart || '#1e293b'}
                onChange={(e) => onUpdateBackground({ ...background, gradientStart: e.target.value })}
                className="w-8 h-8 rounded-lg border border-brand-500/20 cursor-pointer"
              />
              <input
                type="text"
                value={background.gradientStart || '#1e293b'}
                onChange={(e) => onUpdateBackground({ ...background, gradientStart: e.target.value })}
                className="glass-input flex-1 px-3 py-1.5 text-xs font-mono"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 w-12">Fin</label>
              <input
                type="color"
                value={background.gradientEnd || '#0f172a'}
                onChange={(e) => onUpdateBackground({ ...background, gradientEnd: e.target.value })}
                className="w-8 h-8 rounded-lg border border-brand-500/20 cursor-pointer"
              />
              <input
                type="text"
                value={background.gradientEnd || '#0f172a'}
                onChange={(e) => onUpdateBackground({ ...background, gradientEnd: e.target.value })}
                className="glass-input flex-1 px-3 py-1.5 text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 w-12">Ángulo</label>
              <input
                type="range"
                min={0}
                max={360}
                value={background.gradientAngle || 135}
                onChange={(e) => onUpdateBackground({ ...background, gradientAngle: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs text-slate-400 w-8 text-right">{background.gradientAngle || 135}°</span>
            </div>
          </div>

          {/* Preview */}
          <div
            className="h-12 rounded-xl border border-brand-500/10"
            style={{
              background: `linear-gradient(${background.gradientAngle || 135}deg, ${background.gradientStart || '#1e293b'} 0%, ${background.gradientEnd || '#0f172a'} 100%)`,
            }}
          />
        </div>
      )}

      {/* Image Background */}
      {background.type === 'image' && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Imagen de fondo
          </h4>

          {/* Error alert */}
          {uploadError && (
            <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-300 flex-1">{uploadError}</p>
              <button onClick={() => setUploadError(null)} className="text-red-400/60 hover:text-red-300 flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 p-4 bg-surface-900/50 hover:bg-brand-500/10 border border-dashed border-brand-500/20 rounded-xl transition-all hover:border-brand-500/40"
          >
            <Upload className="w-5 h-5 text-brand-400" />
            <div className="text-left">
              <p className="text-xs text-slate-300">Subir imagen</p>
              <p className="text-[10px] text-slate-500">JPG o PNG. Máx. {MAX_FILE_SIZE_MB} MB</p>
            </div>
          </button>

          {background.imageUrl && (
            <>
              {/* Preview */}
              <div className="rounded-xl overflow-hidden border border-brand-500/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={background.imageUrl} alt="Fondo" className="w-full h-24 object-cover" />
              </div>

              {/* Opacity */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 w-16">Opacidad</label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={background.imageOpacity ?? 1}
                  onChange={(e) => onUpdateBackground({ ...background, imageOpacity: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-slate-400 w-10 text-right">
                  {Math.round((background.imageOpacity ?? 1) * 100)}%
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Presets */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          Presets de fondo
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUND_PRESETS.map((preset, i) => {
            const style: React.CSSProperties =
              preset.type === 'solid'
                ? { background: preset.color }
                : preset.type === 'gradient'
                ? {
                    background: `linear-gradient(${preset.gradientAngle || 135}deg, ${preset.gradientStart} 0%, ${preset.gradientEnd} 100%)`,
                  }
                : {};

            return (
              <button
                key={i}
                onClick={() => onUpdateBackground(preset)}
                className="w-full aspect-square rounded-xl border border-brand-500/10 hover:border-brand-500/40 transition-all hover:scale-105 active:scale-95"
                style={style}
                title={preset.type === 'solid' ? preset.color : `${preset.gradientStart} → ${preset.gradientEnd}`}
              />
            );
          })}
        </div>
      </div>

      {/* Gallery placeholder */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          Galería de fondos
        </h4>
        <div className="text-center py-6 bg-surface-900/30 rounded-xl border border-dashed border-brand-500/10">
          <ImageIcon className="w-6 h-6 mx-auto mb-2 text-slate-600" />
          <p className="text-xs text-slate-500">Próximamente</p>
          <p className="text-[10px] text-slate-600">Fondos prediseñados</p>
        </div>
      </div>
    </div>
  );
}
