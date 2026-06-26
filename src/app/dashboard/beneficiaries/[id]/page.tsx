'use client';

import { useEffect, useState, useRef} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Beneficiary, DigitalCard, BenefitAssignment } from '@/lib/types';
import { DigitalCardView } from '@/components/cards/DigitalCardView';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatDate, formatRut, getBenefitTypeLabel } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Gift,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';

export default function BeneficiaryDetailPage() {
  const { id } = useParams();
  const { organization } = useAuth();
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [assignments, setAssignments] = useState<BenefitAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const fetchData = async () => {
      if (!organization || !id) return;

      const [
        { data: benData },
        { data: cardData },
        { data: assignData },
      ] = await Promise.all([
        supabase.from('beneficiaries').select('*').eq('id', id).single(),
        supabase.from('digital_cards').select('*').eq('beneficiary_id', id).order('issued_at', { ascending: false }).limit(1).single(),
        supabase.from('benefit_assignments').select('*, benefits(*)').eq('beneficiary_id', id).order('assigned_at', { ascending: false }),
      ]);

      if (benData) setBeneficiary(benData);
      if (cardData) setCard(cardData);
      if (assignData) {
        setAssignments(assignData.map((a: Record<string, unknown>) => ({
          ...a,
          benefit: (a as Record<string, unknown>).benefits,
        })) as BenefitAssignment[]);
      }
      setLoading(false);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, id]);

  if (loading) return <PageSkeleton />;
  if (!beneficiary) return <div className="text-center py-20 text-slate-400">socio no encontrado</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/beneficiaries" className="p-2 rounded-xl btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{beneficiary.full_name}</h1>
            <p className="text-slate-400 text-sm font-mono">{formatRut(beneficiary.rut)}</p>
          </div>
        </div>
        <Link
          href={`/dashboard/beneficiaries/${beneficiary.id}/edit`}
          className="btn-secondary px-4 py-2.5 text-sm flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Digital Card Preview */}
        {card && organization && (
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-3">Tarjeta Digital</h2>
            <div className="max-w-xl">
              <DigitalCardView
                beneficiary={beneficiary}
                card={card}
                organization={organization}
              />
            </div>
          </div>
        )}

        {/* Personal Info */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Información Personal</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-900 border border-brand-500/10">
                {beneficiary.photo_url ? (
                  <Image src={beneficiary.photo_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-600" />
                  </div>
                )}
              </div>
              <div>
                <StatusBadge status={beneficiary.status} />
                <p className="text-xs text-slate-500 mt-1">Registrado {formatDate(beneficiary.created_at)}</p>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {beneficiary.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">{beneficiary.email}</span>
                </div>
              )}
              {beneficiary.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">{beneficiary.phone}</span>
                </div>
              )}
              {beneficiary.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">{beneficiary.address}</span>
                </div>
              )}
              {beneficiary.date_of_birth && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">{formatDate(beneficiary.date_of_birth)}</span>
                </div>
              )}
            </div>
            {beneficiary.custom_fields && Object.keys(beneficiary.custom_fields).length > 0 && (
              <div className="pt-4 border-t border-brand-500/10">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Campos Personalizados</h3>
                <div className="space-y-2">
                  {Object.entries(beneficiary.custom_fields).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{key}</span>
                      <span className="text-slate-300">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Beneficios Asignados</h2>
            <span className="text-sm text-slate-400">{assignments.length} total</span>
          </div>
          {assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-brand-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{a.benefit?.name || 'Beneficio'}</p>
                      <p className="text-xs text-slate-500">
                        {a.benefit?.type ? getBenefitTypeLabel(a.benefit.type) : ''} · {formatDate(a.assigned_at)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin beneficios asignados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
