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
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Download
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { exportElementToPDF } from '@/lib/pdfGenerator';

interface CardWithBeneficiary extends DigitalCard {
  beneficiary: Beneficiary;
  design?: any; // any to avoid complex type issues here, or we can use CardDesign
}

export default function CardsPage() {
  const { organization, membership, loading: authLoading } = useAuth();
  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';
  const [cards, setCards] = useState<CardWithBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCard, setSelectedCard] = useState<CardWithBeneficiary | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchCards = async () => {
      if (!organization) {
        if (!authLoading) setLoading(false);
        return;
      }
      
      try {
        let query = supabase
          .from('digital_cards')
          .select('*, beneficiaries(*)')
          .eq('org_id', organization.id)
          .order('issued_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        
        const { data: designs } = await supabase
          .from('card_designs')
          .select('*')
          .eq('org_id', organization.id);

        if (!error && data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let mapped = data.map((c: any) => {
            // Find design
            const design = designs?.find(d => d.id === c.metadata?.design_id);
            return {
              ...c,
              beneficiary: c.beneficiaries,
              design
            };
          });

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
      } catch (err) {
        console.error('Error in fetchCards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, statusFilter, search]);

  const toggleSelectAll = () => {
    if (selectedIds.length === cards.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cards.map(c => c.id));
    }
  };

  const toggleSelectCard = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkStatusChange = async (newStatus: CardWithBeneficiary['status']) => {
    if (!isAdmin || selectedIds.length === 0) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('digital_cards')
        .update({ status: newStatus })
        .in('id', selectedIds);
        
      if (!error) {
        setCards(cards.map(c => selectedIds.includes(c.id) ? { ...c, status: newStatus } : c));
        setSelectedIds([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCards = async (ids: string[]) => {
    if (!isAdmin || ids.length === 0) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar ${ids.length} tarjeta(s)? Esta acción no se puede deshacer y las tarjetas quedarán anuladas.`)) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('digital_cards')
        .delete()
        .in('id', ids);
        
      if (!error) {
        setCards(cards.filter(c => !ids.includes(c.id)));
        setSelectedIds(selectedIds.filter(selId => !ids.includes(selId)));
        setSelectedCard(null); // in case we deleted the selected one
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

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
              <option value="draft">Borradores</option>
              <option value="active">Activas</option>
              <option value="expired">Caducadas</option>
              <option value="blocked">Bloqueadas</option>
              <option value="revoked">Revocadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats and Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm text-slate-400">
          {cards.length} tarjeta{cards.length !== 1 ? 's' : ''} encontrada{cards.length !== 1 ? 's' : ''}
          {selectedIds.length > 0 && (
            <span className="ml-2 text-brand-400 font-medium">({selectedIds.length} seleccionadas)</span>
          )}
        </div>
        
        {isAdmin && selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-in bg-surface-900 border border-brand-500/20 p-2 rounded-xl">
            <span className="text-sm text-slate-400 mr-2 ml-2">Cambiar estado a:</span>
            <button
              onClick={() => handleBulkStatusChange('active')}
              disabled={isUpdating}
              className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md border border-emerald-500/20 transition-colors disabled:opacity-50"
            >
              Activa
            </button>
            <button
              onClick={() => handleBulkStatusChange('draft')}
              disabled={isUpdating}
              className="px-3 py-1 text-xs bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 rounded-md border border-slate-500/20 transition-colors disabled:opacity-50"
            >
              Pendiente
            </button>
            <button
              onClick={() => handleBulkStatusChange('revoked')}
              disabled={isUpdating}
              className="px-3 py-1 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md border border-red-500/20 transition-colors disabled:opacity-50"
            >
              Revocar
            </button>
            <div className="w-px h-6 bg-slate-700 mx-2"></div>
            <button
              onClick={() => handleDeleteCards(selectedIds)}
              disabled={isUpdating}
              className="px-3 py-1 flex items-center gap-1 text-xs bg-red-900/40 text-red-400 hover:bg-red-900/60 rounded-md border border-red-900/50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Eliminar
            </button>
          </div>
        )}
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
                  design={c.design}
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
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelectCard(c.id); }}
                  className="absolute top-4 left-4 z-10 bg-surface-900/50 backdrop-blur-sm rounded"
                >
                  {selectedIds.includes(c.id) ? (
                    <CheckSquare className="w-6 h-6 text-brand-400" />
                  ) : (
                    <Square className="w-6 h-6 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && (
                  <th className="w-12">
                    <button onClick={toggleSelectAll}>
                      {selectedIds.length === cards.length && cards.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-brand-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </th>
                )}
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
                  {isAdmin && (
                    <td>
                      <button onClick={() => toggleSelectCard(c.id)}>
                        {selectedIds.includes(c.id) ? (
                          <CheckSquare className="w-5 h-5 text-brand-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="font-medium text-white">{c.beneficiary?.full_name}</td>
                  <td className="font-mono text-xs text-slate-400">{c.card_number}</td>
                  <td><StatusBadge status={c.status} size="sm" /></td>
                  <td className="text-xs text-slate-400">{formatDate(c.issued_at)}</td>
                  <td className="text-xs text-slate-400">{formatDate(c.expires_at)}</td>
                  <td className="text-right flex items-center justify-end gap-2">
                    {c.status === 'draft' && (
                      <button
                        onClick={async () => {
                          const { error } = await supabase.from('digital_cards').update({ status: 'active' }).eq('id', c.id);
                          if (!error) {
                            setCards(cards.map(card => card.id === c.id ? { ...card, status: 'active' } : card));
                          }
                        }}
                        className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md border border-emerald-500/20"
                      >
                        Aprobar
                      </button>
                    )}
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
            <div id="card-canvas-export" className="flex justify-center bg-white/5 p-4 rounded-xl">
              <DigitalCardView
                beneficiary={selectedCard.beneficiary}
                card={selectedCard}
                organization={organization}
                design={selectedCard.design}
              />
            </div>
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
            <div className="pt-4 border-t border-brand-500/10 flex justify-between items-center">
              {isAdmin ? (
                <button
                  onClick={() => handleDeleteCards([selectedCard.id])}
                  disabled={isUpdating}
                  className="px-4 py-2 flex items-center gap-2 text-sm bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar Tarjeta
                </button>
              ) : <div></div>}
              
              {selectedCard.status === 'draft' && (
                <button
                  onClick={async () => {
                    const { error } = await supabase.from('digital_cards').update({ status: 'active' }).eq('id', selectedCard.id);
                    if (!error) {
                      setCards(cards.map(card => card.id === selectedCard.id ? { ...card, status: 'active' } : card));
                      setSelectedCard({ ...selectedCard, status: 'active' });
                    }
                  }}
                  className="btn-primary px-6 py-2"
                >
                  Aprobar y Emitir
                </button>
              )}
              
              <button
                onClick={async () => {
                  setExporting(true);
                  await exportElementToPDF('card-canvas-export', {
                    filename: `tarjeta-${selectedCard.beneficiary.rut}`,
                    orientation: 'portrait',
                    paperSize: 'a5',
                    scale: 3,
                    margin: 0
                  });
                  setExporting(false);
                }}
                disabled={exporting}
                className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {exporting ? (
                  <><div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /> Generando...</>
                ) : (
                  <><Download className="w-4 h-4" /> Descargar PDF</>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
