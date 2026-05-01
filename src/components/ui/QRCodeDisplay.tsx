'use client';

import { useEffect, useState } from 'react';
import * as QRCode from 'qrcode';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  className?: string;
  color?: {
    dark?: string;
    light?: string;
  };
}

export function QRCodeDisplay({ data, size = 256, className = '', color }: QRCodeDisplayProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setError(null);
      
      // Use standard colors for maximum compatibility in preview
      // Often custom colors or transparency in the 'light' field cause issues
      const darkColor = '#000000';
      const lightColor = '#ffffff';

      QRCode.toDataURL(data, {
        width: size,
        margin: 1,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: 'M',
      })
      .then(url => {
        setQrUrl(url);
      })
      .catch(err => {
        console.error('QR Generation Error:', err);
        setError(err.message || 'Error');
      });
    }
  }, [data, size]); // Removed color dependency to stabilize preview

  if (error) return (
    <div className="flex flex-col items-center justify-center bg-red-50 text-red-500 p-2 w-full h-full text-[10px]">
      <span>QR Error</span>
    </div>
  );

  if (!qrUrl) return <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} style={{ width: '100%', height: '100%' }} />;

  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      <img 
        src={qrUrl} 
        alt="QR Code" 
        className="w-full h-full object-contain"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
}
