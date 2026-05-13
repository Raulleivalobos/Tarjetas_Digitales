'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, SwitchCamera, QrCode, X, Smartphone } from 'lucide-react';

interface QRScannerProps {
  onScan: (cardId: string) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  isProcessing?: boolean;
  message?: { type: 'success' | 'error' | 'warning'; text: string } | null;
}

export default function QRScanner({ onScan, onClose, title = 'Escáner QR', subtitle = 'Apunta la cámara al código QR de la tarjeta', isProcessing = false, message }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<string>('qr-reader-' + Math.random().toString(36).substr(2, 9));

  const startScanner = useCallback(async () => {
    setError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Clean up any existing scanner
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(containerRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText: string) => {
          // Extract card ID from QR URL: .../validate/{slug}/{cardId}
          const parts = decodedText.split('/');
          const cardId = parts[parts.length - 1];
          if (cardId && cardId.length > 10) {
            onScan(cardId);
          }
        },
        () => {} // Ignore errors during scanning
      );
    } catch (err: any) {
      console.error('Scanner error:', err);
      if (err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
      } else if (err?.message?.includes('NotFoundError')) {
        setError('No se encontró una cámara en este dispositivo.');
      } else {
        setError('No se pudo iniciar la cámara. Verifica los permisos del navegador.');
      }
      setScanning(false);
    }
  }, [facingMode, onScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const switchCamera = useCallback(async () => {
    await stopScanner();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, [stopScanner]);

  // Restart scanner when facingMode changes
  useEffect(() => {
    if (scanning) {
      // Small delay to allow cleanup
      const timer = setTimeout(() => startScanner(), 300);
      return () => clearTimeout(timer);
    }
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
      }
    };
  }, []);

  return (
    <div className="glass-card-solid rounded-3xl border border-brand-500/20 overflow-hidden">
      {/* Header */}
      <div className="bg-brand-500/10 px-6 py-4 border-b border-brand-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-[10px] text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {scanning && (
            <button onClick={switchCamera} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all" title="Cambiar cámara">
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button onClick={() => { stopScanner(); onClose(); }} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scanner Body */}
      <div className="p-6">
        {!scanning ? (
          <div className="text-center py-8 space-y-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-3xl bg-brand-500/10 border-2 border-dashed border-brand-500/30 flex items-center justify-center mx-auto">
                <Smartphone className="w-10 h-10 text-brand-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div>
              <p className="text-slate-300 font-medium mb-1">Listo para escanear</p>
              <p className="text-slate-500 text-xs max-w-xs mx-auto">Presiona el botón para activar la cámara y apunta al código QR de la tarjeta del socio</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium max-w-sm mx-auto">
                {error}
              </div>
            )}

            <button 
              onClick={startScanner}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white font-bold text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-3 mx-auto active:scale-95"
            >
              <Camera className="w-5 h-5" />
              Abrir Cámara
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Reader Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <div id={containerRef.current} className="w-full" />
              
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                    <p className="text-white text-xs font-bold">Procesando...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Scanner Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Escáner activo</span>
              </div>
              <button 
                onClick={stopScanner}
                className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center gap-2"
              >
                <CameraOff className="w-3.5 h-3.5" />
                Detener
              </button>
            </div>
          </div>
        )}

        {/* Status Message Overlay/Footer */}
        {message && (
          <div className={`mt-4 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
            message.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' :
            'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            <div className="shrink-0">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
               message.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
               <XCircle className="w-5 h-5" />}
            </div>
            <p className="text-sm font-bold leading-tight">{message.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Re-import icons needed for the message
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

