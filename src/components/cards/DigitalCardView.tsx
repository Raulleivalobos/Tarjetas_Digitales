'use client';

import { Beneficiary, DigitalCard, Organization } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import { formatDate, generateQRData } from '@/lib/utils';
import { Shield, Calendar, User } from 'lucide-react';
import Image from 'next/image';

interface DigitalCardViewProps {
  beneficiary: Beneficiary;
  card: DigitalCard;
  organization: Organization;
  showQR?: boolean;
  compact?: boolean;
}

export function DigitalCardView({
  beneficiary,
  card,
  organization,
  showQR = true,
  compact = false,
}: DigitalCardViewProps) {
  const qrData = generateQRData(card.id, organization.slug);

  return (
    <div className={`digital-card ${compact ? 'p-4' : 'p-6'} flex flex-col justify-between`}>
      {/* Top section */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          {organization.logo_url ? (
            <Image
              src={organization.logo_url}
              alt={organization.name}
              width={compact ? 32 : 44}
              height={compact ? 32 : 44}
              className="rounded-lg object-cover"
            />
          ) : (
            <div
              className={`${compact ? 'w-8 h-8' : 'w-11 h-11'} rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center`}
            >
              <Shield className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
            </div>
          )}
          <div>
            <h3 className={`font-bold text-white ${compact ? 'text-xs' : 'text-sm'}`}>
              {organization.name}
            </h3>
            <p className={`text-slate-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
              Tarjeta de Identificación
            </p>
          </div>
        </div>
        <StatusBadge status={card.status} size={compact ? 'sm' : 'md'} />
      </div>

      {/* Middle section */}
      <div className="flex items-end justify-between relative z-10 mt-auto">
        <div className="flex items-center gap-3">
          {/* Photo */}
          <div
            className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} rounded-xl overflow-hidden border-2 border-brand-500/30 bg-surface-900 flex-shrink-0`}
          >
            {beneficiary.photo_url ? (
              <Image
                src={beneficiary.photo_url}
                alt={beneficiary.full_name}
                width={compact ? 48 : 64}
                height={compact ? 48 : 64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-slate-600`} />
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h2 className={`font-bold text-white ${compact ? 'text-sm' : 'text-lg'}`}>
              {beneficiary.full_name}
            </h2>
            <p className={`text-brand-300 font-mono ${compact ? 'text-[10px]' : 'text-xs'}`}>
              RUT: {beneficiary.rut}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span className={`text-slate-500 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                Exp: {formatDate(card.expires_at)}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="flex-shrink-0">
            <QRCodeDisplay
              data={qrData}
              size={compact ? 60 : 90}
              className="!p-1.5 !rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Card number */}
      <div className="flex items-center justify-between mt-3 relative z-10">
        <p className={`font-mono text-slate-500 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          N° {card.card_number}
        </p>
        <p className={`font-mono text-slate-500 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          Emitida: {formatDate(card.issued_at)}
        </p>
      </div>
    </div>
  );
}
