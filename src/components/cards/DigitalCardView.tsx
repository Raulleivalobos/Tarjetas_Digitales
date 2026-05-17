'use client';

import { useState, useEffect } from 'react';
import { Beneficiary, DigitalCard, Organization } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import { formatDate, generateQRData, formatRut } from '@/lib/utils';
import { Shield, Calendar, User } from 'lucide-react';
import Image from 'next/image';

interface DigitalCardViewProps {
  beneficiary: Beneficiary;
  card: DigitalCard;
  organization: Organization;
  showQR?: boolean;
  compact?: boolean;
}

import { CanvasPreview } from '@/components/designer/CanvasPreview';

export function DigitalCardView({
  beneficiary,
  card,
  organization,
  showQR = true,
  compact = false,
  design, // Optional custom design
}: DigitalCardViewProps & { design?: any }) {
  const [mounted, setMounted] = useState(false);
  const [qrData, setQrData] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    setQrData(generateQRData(card.id, organization.slug));
  }, [card.id, organization.slug]);

  if (!mounted) return null; // Prevent hydration mismatch

  // Helper to ensure Google Drive URLs use the most reliable endpoint
  const getDriveUrls = (url: string | null | undefined) => {
    if (!url) return { direct: null, proxied: null };
    const trimmed = url.trim();
    
    let direct = trimmed;
    const fileIdMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)([^/&]+)/);
    
    if (fileIdMatch) {
      direct = `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w800`;
    } else if (trimmed.includes('googleusercontent.com') && !trimmed.includes('sz=')) {
      // Ensure we have a size parameter if it's a direct LH3 link without one
      direct = trimmed.includes('?') ? `${trimmed}&sz=w800` : `${trimmed}?sz=w800`;
    }

    const proxied = direct.startsWith('http') 
      ? `/api/proxy-image?url=${encodeURIComponent(direct)}`
      : direct;

    return { direct, proxied };
  };

  const { direct: directPhotoUrl, proxied: proxiedPhotoUrl } = getDriveUrls(beneficiary.photo_url);

  if (design) {
    // Clone and populate the design with actual beneficiary data
    const hasQR = design.elements.some((el: any) => el.type === 'qr');
    const elements = [...design.elements];

    // If no QR element is found in the design, inject a default one at the bottom right
    if (!hasQR && showQR) {
      elements.push({
        id: 'auto-qr',
        type: 'qr',
        x: 82,
        y: 65,
        width: 15,
        height: 25,
        zIndex: 50,
        data: {
          content: qrData,
          isAttribute: true
        }
      });
    }

    const populatedDesign = {
      ...design,
      elements: elements.filter((el: any) => {
        if (el.type === 'text') {
          const contentLower = (el.data.content || '').toLowerCase();
          const keyLower = (el.data.attributeKey || '').toLowerCase();
          
          // Ocultar elementos exclusivos de certificados de residencia en la tarjeta digital
          if (
            contentLower.includes('folio:') || keyLower.includes('folio') ||
            contentLower.includes('precio $') || keyLower.includes('precio') || keyLower.includes('valor') ||
            contentLower.includes('art. 210') || contentLower.includes('responsabilidad exclusiva') ||
            contentLower.includes('falsedad constituye delito')
          ) {
            return false;
          }
        }
        return true;
      }).map((el: any) => {
        if (el.type === 'text' && el.data.isAttribute) {
          let val = el.data.content;
          const attrKey = el.data.attributeKey?.trim();
          const keyUpper = attrKey?.toUpperCase();
          const customVal = beneficiary.custom_fields ? (beneficiary.custom_fields as any)[attrKey] : undefined;

          if (keyUpper === 'NOMBRE RECEPTOR' || keyUpper === 'NOMBRE') val = customVal || beneficiary.full_name || val;
          else if (keyUpper === 'NOMBRE INSTITUCIÓN' || keyUpper === 'ORGANIZACION') val = customVal || organization.name || val;
          else if (keyUpper === 'RUT') val = customVal || formatRut(beneficiary.rut) || val;
          else if (keyUpper === 'ID SOCIO') val = customVal || val;
          else if (keyUpper === 'FECHA' || keyUpper === 'FECHA EMISIÓN') val = customVal || formatDate(card.issued_at) || val;
          else if (keyUpper === 'STATUS SOCIO' || keyUpper === 'ESTADO') val = customVal || (card.status === 'active' ? 'Activo' : card.status) || val;
          else if (keyUpper === 'EMAIL' || keyUpper === 'CORREO') val = customVal || beneficiary.email || val;
          else if (keyUpper === 'DIRECCIÓN' || keyUpper === 'DIRECCION' || keyUpper === 'DOMICILIO') {
            const combined = [beneficiary.address, beneficiary.address_number].filter(Boolean).join(' ');
            val = combined || customVal || val;
          }
          else if (keyUpper && (keyUpper.includes('TARJETA') || keyUpper.includes('Nº') || keyUpper.includes('N°'))) {
            val = card.card_number || val;
            // Forzar un tamaño de fuente pequeño y forzar un ancho mínimo para que quepa en una sola línea
            if (el.data.fontSize > 8) el.data.fontSize = 8;
            if (el.width < 40) el.width = 40; // expandir ancho a 40%
            el.data.textAlign = 'right'; // alinear a la derecha si está bajo el QR
          }
          else if (customVal !== undefined) val = customVal;

          return { ...el, data: { ...el.data, content: val } };
        }
        if (el.type === 'image') {
          const attrKey = el.data.attributeKey;
          const attrKeyUpper = attrKey?.toUpperCase();
          let src = el.data.src;
          
          // Match photo attributes: FOTO, PHOTO, PHOTO_URL, or any key containing 'FOTO' or 'PHOTO'
          const isPhotoAttr = attrKeyUpper === 'FOTO' || 
                             attrKeyUpper === 'PHOTO' || 
                             attrKeyUpper === 'PHOTO_URL' ||
                             (attrKeyUpper && (attrKeyUpper.includes('FOTO') || attrKeyUpper.includes('PHOTO')));

          if (isPhotoAttr && directPhotoUrl) {
            src = directPhotoUrl;
          }
          return { ...el, data: { ...el.data, src } };
        }
        if (el.type === 'qr') {
          return { ...el, data: { ...el.data, content: qrData } };
        }
        return el;
      }),
    };

    return (
      <div className={`relative overflow-hidden flex justify-center items-center ${compact ? 'w-full max-w-[280px] mx-auto' : 'w-full'}`}>
        <CanvasPreview 
          design={populatedDesign} 
          selectedElementId={null} 
          scale={compact ? 0.7 : 1}
          readOnly={true}
        />
      </div>
    );
  }

  return (
    <div className={`digital-card relative overflow-hidden group ${compact ? 'p-4' : 'p-8'} flex flex-col justify-between transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.2)] border-white/5`}>
      {/* Blueprint Decorations */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-brand-500/20" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-brand-500/20" />
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <span className="text-[8px] font-mono font-bold text-brand-400 tracking-widest uppercase italic">ENCRYPTED_SYSTEM_v2</span>
      </div>

      {/* Top section */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          {organization.logo_url ? (
            <div className="relative flex-shrink-0">
              <img
                src={organization.logo_url.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(organization.logo_url)}` : organization.logo_url}
                alt={organization.name}
                width={compact ? 28 : 48}
                height={compact ? 28 : 48}
                className="rounded-lg object-cover border border-white/10 shadow-lg"
                crossOrigin="anonymous"
              />
            </div>
          ) : (
            <div
              className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg border border-white/10 flex-shrink-0`}
            >
              <Shield className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className={`font-black text-white uppercase tracking-tighter leading-none truncate ${compact ? 'text-[10px]' : 'text-base'}`}>
              {organization.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="text-[7px] font-bold text-brand-400 font-mono tracking-widest uppercase bg-brand-500/10 px-1 rounded flex-shrink-0">SECURE_NODE</span>
            </div>
          </div>
        </div>
        <StatusBadge status={card.status} size="sm" />
      </div>
      {/* Middle section */}
      <div className={`flex items-end justify-between relative z-10 ${compact ? 'mt-4' : 'mt-10'}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Photo */}
          <div
            className={`${compact ? 'w-12 h-12' : 'w-20 h-20'} rounded-xl overflow-hidden border-2 border-brand-500/20 bg-surface-900 flex-shrink-0 shadow-2xl group-hover:border-brand-500/40 transition-colors`}
          >
            {proxiedPhotoUrl ? (
              <img
                src={proxiedPhotoUrl}
                alt={beneficiary.full_name}
                width={compact ? 48 : 80}
                height={compact ? 48 : 80}
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className={`${compact ? 'w-6 h-6' : 'w-10 h-10'} text-brand-400 opacity-30`} />
              </div>
            )}
          </div>
 
          {/* Info */}
          <div className="min-w-0 flex-1">
            <h2 className={`font-black text-white tracking-tighter uppercase leading-[0.85] break-words line-clamp-2 ${compact ? 'text-xs' : 'text-xl'}`}>
              {beneficiary.full_name}
            </h2>
            <div className="flex flex-col mt-1">
               <span className="text-[7px] font-bold text-slate-500 font-mono tracking-widest uppercase whitespace-nowrap shrink-0">ID_FISCAL:</span>
               <p className={`text-brand-400 font-mono font-bold tracking-[0.1em] whitespace-nowrap ${compact ? 'text-[10px]' : 'text-sm'}`}>
                {formatRut(beneficiary.rut)}
              </p>
            </div>
          </div>
        </div>
 
        {/* QR Code */}
        {showQR && (
          <div className="flex-shrink-0 relative group/qr ml-2">
            <QRCodeDisplay
              data={qrData}
              size={compact ? 48 : 100}
              className="!p-1.5 !rounded-lg !bg-white hover:scale-105 transition-transform duration-300 shadow-2xl"
            />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full border border-[#020617] shadow-lg shadow-brand-500/50" />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className={`flex items-center justify-between border-t border-white/5 relative z-10 ${compact ? 'mt-4 pt-2' : 'mt-6 pt-4'}`}>
        <div className="flex flex-col">
          <span className="text-[7px] font-bold text-slate-600 font-mono tracking-[0.2em] uppercase">CARD_SERIAL_NUM</span>
          <p className={`font-mono text-slate-400 font-bold tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
            {card.card_number || 'X-000-000-00'}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[7px] font-bold text-slate-600 font-mono tracking-[0.2em] uppercase">ISSUE_DATE</span>
          <p className={`font-mono text-slate-400 font-bold tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
            {formatDate(card.issued_at)}
          </p>
        </div>
      </div>
      
      {/* Decorative Scanline - only visible on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.03] to-transparent h-20 w-full top-[-100%] group-hover:top-[100%] transition-all duration-[3000ms] pointer-events-none" />
    </div>
  );
}
