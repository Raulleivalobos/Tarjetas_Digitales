'use client';

import { ImageElement, ShapeElement, QRElement, generateElementId } from '@/lib/cardDesignTypes';
import {
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  QrCode,
  Plus,
  Upload,
  Sparkles,
  AlertTriangle,
  Maximize,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png';

interface ElementsPanelProps {
  onAddImage: (element: { type: 'image'; data: ImageElement }) => void;
  onAddShape: (element: { type: 'shape'; data: ShapeElement }) => void;
  onAddQR: (element: { type: 'qr'; data: QRElement }) => void;
}

export function ElementsPanel({
  onAddImage,
  onAddShape,
  onAddQR,
}: ElementsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Validate file before processing
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Formato no soportado. Solo se aceptan archivos JPG y PNG.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `El archivo pesa ${sizeMB} MB. El tamaño máximo permitido es ${MAX_FILE_SIZE_MB} MB.`;
    }
    return null;
  };

  // Add image as a regular element (small, positioned)
  const handleAddImage = (src?: string) => {
    const element: { type: 'image'; data: ImageElement } = {
      type: 'image',
      data: {
        id: generateElementId(),
        type: 'decoration',
        src: src || '',
        x: 5,
        y: 5,
        width: 20,
        height: 20,
        rotation: 0,
        opacity: 1,
        borderRadius: 8,
      },
    };
    onAddImage(element);
  };

  // Add image as full-size background element (covers entire card)
  const handleAddBackgroundImage = (src: string) => {
    const element: { type: 'image'; data: ImageElement } = {
      type: 'image',
      data: {
        id: generateElementId(),
        type: 'photo',
        src,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        borderRadius: 0,
      },
    };
    onAddImage(element);
  };

  // Handle regular image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      e.target.value = '';
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      handleAddImage(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle background image upload — auto-fits to card size
  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      e.target.value = '';
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      handleAddBackgroundImage(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddShape = (type: 'rectangle' | 'circle' | 'line' | 'divider') => {
    const element: { type: 'shape'; data: ShapeElement } = {
      type: 'shape',
      data: {
        id: generateElementId(),
        type,
        x: 10,
        y: 50,
        width: type === 'line' || type === 'divider' ? 80 : 20,
        height: type === 'line' || type === 'divider' ? 0.5 : 10,
        fill: type === 'line' || type === 'divider' ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)',
        stroke: 'rgba(99,102,241,0.2)',
        strokeWidth: type === 'line' || type === 'divider' ? 0 : 1,
        rotation: 0,
        opacity: 1,
        borderRadius: type === 'circle' ? 999 : 8,
      },
    };
    onAddShape(element);
  };

  const handleAddQR = () => {
    const element: { type: 'qr'; data: QRElement } = {
      type: 'qr',
      data: {
        id: generateElementId(),
        x: 70,
        y: 65,
        size: 18,
        foreground: '#ffffff',
        background: 'rgba(15,23,42,0.8)',
      },
    };
    onAddQR(element);
  };

  return (
    <div className="space-y-5">
      {/* Error alert */}
      {uploadError && (
        <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-300 font-medium">Error al subir archivo</p>
            <p className="text-[10px] text-red-400/80 mt-0.5">{uploadError}</p>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="p-0.5 text-red-400/60 hover:text-red-300 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Images */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand-400" />
          Imágenes
        </h4>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={bgFileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleBgFileUpload}
          className="hidden"
        />

        <div className="space-y-2">
          {/* Upload as background (full card size) */}
          <button
            onClick={() => bgFileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-4 bg-surface-900/50 hover:bg-brand-500/10 border border-dashed border-brand-500/20 rounded-xl transition-all hover:border-brand-500/40 group"
          >
            <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center group-hover:bg-brand-500/20 transition-colors flex-shrink-0">
              <Maximize className="w-5 h-5 text-brand-400" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs text-white font-medium">Subir imagen de fondo</p>
              <p className="text-[10px] text-slate-500">Se ajusta al tamaño de la tarjeta</p>
            </div>
          </button>

          {/* Upload as regular element */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-4 bg-surface-900/50 hover:bg-brand-500/10 border border-dashed border-brand-500/20 rounded-xl transition-all hover:border-brand-500/40"
            >
              <Upload className="w-5 h-5 text-brand-400" />
              <span className="text-xs text-slate-300">Subir imagen</span>
              <span className="text-[10px] text-slate-500">Elemento libre</span>
            </button>

            <button
              onClick={() => handleAddImage()}
              className="flex flex-col items-center gap-2 p-4 bg-surface-900/50 hover:bg-brand-500/10 border border-dashed border-brand-500/20 rounded-xl transition-all hover:border-brand-500/40"
            >
              <Plus className="w-5 h-5 text-brand-400" />
              <span className="text-xs text-slate-300">Marcador</span>
              <span className="text-[10px] text-slate-500">Placeholder</span>
            </button>
          </div>
        </div>

        {/* File restrictions notice */}
        <div className="mt-3 flex items-start gap-2 p-2.5 bg-surface-900/40 rounded-lg border border-brand-500/5">
          <ImageIcon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Aceptamos archivos <span className="text-slate-400 font-medium">JPG</span> y <span className="text-slate-400 font-medium">PNG</span>.
            El tamaño máximo debe ser de <span className="text-slate-400 font-medium">{MAX_FILE_SIZE_MB} MB</span>.
          </p>
        </div>
      </div>

      {/* Logo presets */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Añadir logo
        </h4>
        <button
          onClick={() => {
            const element: { type: 'image'; data: ImageElement } = {
              type: 'image',
              data: {
                id: generateElementId(),
                type: 'logo',
                src: '',
                x: 5,
                y: 5,
                width: 12,
                height: 12,
                rotation: 0,
                opacity: 1,
                borderRadius: 12,
              },
            };
            onAddImage(element);
          }}
          className="w-full text-left px-3 py-2 text-xs text-slate-300 bg-surface-900/50 hover:bg-brand-500/10 border border-brand-500/10 rounded-lg transition-all hover:border-brand-500/25 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          Logo de organización
        </button>
      </div>

      {/* Shapes */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Square className="w-4 h-4 text-brand-400" />
          Formas
        </h4>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleAddShape('rectangle')}
            className="flex flex-col items-center gap-1.5 p-3 bg-surface-900/50 hover:bg-brand-500/10 border border-brand-500/10 rounded-xl transition-all hover:border-brand-500/30"
            title="Rectángulo"
          >
            <Square className="w-5 h-5 text-brand-300" />
            <span className="text-[10px] text-slate-400">Rect.</span>
          </button>

          <button
            onClick={() => handleAddShape('circle')}
            className="flex flex-col items-center gap-1.5 p-3 bg-surface-900/50 hover:bg-brand-500/10 border border-brand-500/10 rounded-xl transition-all hover:border-brand-500/30"
            title="Círculo"
          >
            <Circle className="w-5 h-5 text-brand-300" />
            <span className="text-[10px] text-slate-400">Círculo</span>
          </button>

          <button
            onClick={() => handleAddShape('line')}
            className="flex flex-col items-center gap-1.5 p-3 bg-surface-900/50 hover:bg-brand-500/10 border border-brand-500/10 rounded-xl transition-all hover:border-brand-500/30"
            title="Línea"
          >
            <Minus className="w-5 h-5 text-brand-300" />
            <span className="text-[10px] text-slate-400">Línea</span>
          </button>

          <button
            onClick={() => handleAddShape('divider')}
            className="flex flex-col items-center gap-1.5 p-3 bg-surface-900/50 hover:bg-brand-500/10 border border-brand-500/10 rounded-xl transition-all hover:border-brand-500/30"
            title="Separador"
          >
            <div className="w-5 h-0.5 bg-brand-300 rounded-full" />
            <span className="text-[10px] text-slate-400">Separ.</span>
          </button>
        </div>
      </div>

      {/* QR Code */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-brand-400" />
          Código QR
        </h4>

        <button
          onClick={handleAddQR}
          className="w-full flex items-center gap-3 p-3 bg-surface-900/50 hover:bg-brand-500/10 border border-brand-500/10 rounded-xl transition-all hover:border-brand-500/30"
        >
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <QrCode className="w-6 h-6 text-surface-900" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-white">Agregar QR</p>
            <p className="text-[10px] text-slate-400">Se generará al emitir la tarjeta</p>
          </div>
        </button>
      </div>
    </div>
  );
}
