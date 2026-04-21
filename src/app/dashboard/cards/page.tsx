'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { DigitalCardView } from '@/components/cards/DigitalCardView';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Beneficiary, DigitalCard } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  Grid3X3,
  List,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface CardWithBeneficiary extends DigitalCard {
  beneficiary: Beneficiary;
}

export default function CardsPage() {
  const { organization } = useAuth();
  const [cards, setCards] = useState<CardWithBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCard, setSelectedCard] = useState<CardWithBeneficiary | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchCards = async () => {
      if (!organization) return;

      let query = supabase
        .from('digital_cards')
        .select('*, beneficiaries(*)')
        .eq('org_id', organization.id)
        .order('issued_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mapped = data.map((c: any) => ({
          ...c,
          beneficiary: c.beneficiaries,
        }));

        if (search) {
          const s = search.toLowerCase();
          mapped = mapped.filter(
            (c: CardWithBeneficiary) =>
              c.beneficiary?.full_name?.toLowerCase().includes(s) ||
              c.beneficiary?.rut?.includes(s) ||
              c.card_number?.toLowerCase().includes(s)
          );
        }

        setCards(mapped);
      }
      setLoading(false);
    };

    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, statusFilter, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Tarjetas Digitales</h1>
          <p className="text-slate-400 mt-1">Vista previa y gestión de tarjetas emitidas</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-900/50 rounded-xl p-1 border border-brand-500/10">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o número de tarjeta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-11 pr-4 py-2.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input px-4 py-2.5 text-sm min-w-[140px]"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="expired">Caducadas</option>
              <option value="blocked">Bloqueadas</option>
              <option value="revoked">Revocadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-slate-400">
        {cards.length} tarjeta{cards.length !== 1 ? 's' : ''} encontrada{cards.length !== 1 ? 's' : ''}
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card p-6"><LoadingSkeleton rows={6} /></div>
      ) : cards.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<CreditCard className="w-8 h-8" />}
            title="No hay tarjetas"
            description="Las tarjetas se generan automáticamente al crear beneficiarios."
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((c) => (
            <div key={c.id} className="group relative">
              {organization && (
                <DigitalCardView
                  beneficiary={c.beneficiary}
                  card={c}
                  organization={organization}
                  compact
                />
              )}
              <button
                onClick={() => setSelectedCard(c)}
                className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <div className="bg-surface-900/90 backdrop-blur-sm px-4 py-2 rounded-xl text-sm text-white flex items-center gap-2 border border-brand-500/20">
                  <Eye className="w-4 h-4" />
                  Ver detalle
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Beneficiario</th>
                <th>N° Tarjeta</th>
                <th>Estado</th>
                <th>Emitida</th>
                <th>Expira</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-white">{c.beneficiary?.full_name}</td>
                  <td className="font-mono text-xs text-slate-400">{c.card_number}</td>
                  <td><StatusBadge status={c.status} size="sm" /></td>
                  <td className="text-xs text-slate-400">{formatDate(c.issued_at)}</td>
                  <td className="text-xs text-slate-400">{formatDate(c.expires_at)}</td>
                  <td className="text-right">
                    <button
                      onClick={() => setSelectedCard(c)}
                      className="p-2 rounded-lg btn-ghost"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card Detail Modal */}
      <Modal
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        title="Vista Previa de Tarjeta"
        size="lg"
      >
        {selectedCard && organization && (
          <div className="space-y-6">
            <DigitalCardView
              beneficiary={selectedCard.beneficiary}
              card={selectedCard}
              organization={organization}
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Número de tarjeta</p>
                <p className="text-white font-mono">{selectedCard.card_number}</p>
              </div>
              <div>
                <p className="text-slate-500">Código QR</p>
                <p className="text-white font-mono text-xs">{selectedCard.qr_code}</p>
              </div>
              <div>
                <p className="text-slate-500">Fecha emisión</p>
                <p className="text-white">{formatDate(selectedCard.issued_at)}</p>
              </div>
              <div>
                <p className="text-slate-500">Fecha expiración</p>
                <p className="text-white">{formatDate(selectedCard.expires_at)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
