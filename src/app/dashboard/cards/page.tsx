'use client';

import { useEffect, useState, useRef} from 'react';
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
  Download,
  Mail,
  ShieldAlert,
  MessageCircle
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { exportElementToPDF } from '@/lib/pdfGenerator';
import { sendCertificateNotification } from '@/app/actions/email';
import { logActivity } from '@/app/actions/audit';

interface CardWithBeneficiary extends DigitalCard {
  beneficiary: Beneficiary;
  design?: any; 
}

export default function CardsPage() {
  const { organization, loading: authLoading, membership, user } = useAuth();
  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';
  const [cards, setCards] = useState<CardWithBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCard, setSelectedCard] = useState<CardWithBeneficiary | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const fetchCards = async () => {
      if (!organization?.id) {
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
          let mapped = data.map((c: any) => {
            const design = designs?.find((d: any) => d.id === c.metadata?.design_id);
            // Handle cases where beneficiaries might be an array or an object
            const benData = Array.isArray(c.beneficiaries) ? c.beneficiaries[0] : c.beneficiaries;
            return {
              ...c,
              beneficiary: benData,
              design
            };
          });

          if (search) {
            const s = search.toLowerCase();
            mapped = mapped.filter(
              (c: CardWithBeneficiary) =>
                c.beneficiary?.full_name?.toLowerCase().includes(s) ||
                c.beneficiary?.rut?.includes(s) ||
                c.card_number?.toLowerCase().includes(s) ||
                c.beneficiary?.address?.toLowerCase().includes(s) ||
                c.beneficiary?.address_number?.toLowerCase().includes(s) ||
                (c.beneficiary?.custom_fields as any)?.['Dirección']?.toLowerCase().includes(s)
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
  }, [organization?.id, statusFilter, search, authLoading]);

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
        // Log activity
        await logActivity({
          orgId: organization!.id,
          userId: membership!.user_id,
          userEmail: user?.email || 'unknown',
          action: `BULK_CARD_STATUS_${newStatus.toUpperCase()}`,
          entityType: 'card',
          details: { count: selectedIds.length, ids: selectedIds }
        });
        
        setCards(cards.map(c => selectedIds.includes(c.id) ? { ...c, status: newStatus } : c));
        setSelectedIds([]);
      }
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevokeCards = async (ids: string[]) => {
    if (!isAdmin || ids.length === 0) return;
    if (!confirm(`¿Estás seguro de que deseas anular ${ids.length} tarjeta(s)? Esto mantendrá el registro pero la tarjeta quedará invalidada para su uso.`)) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('digital_cards')
        .update({ status: 'revoked' })
        .in('id', ids);
        
      if (!error) {
        // Log activity
        await logActivity({
          orgId: organization!.id,
          userId: membership!.user_id,
          userEmail: user?.email || 'unknown',
          action: 'REVOKE_CARDS',
          entityType: 'card',
          details: { count: ids.length, ids: ids }
        });

        setCards(cards.map(c => ids.includes(c.id) ? { ...c, status: 'revoked' } : c));
        setSelectedIds(selectedIds.filter(selId => !ids.includes(selId)));
        if (selectedCard && ids.includes(selectedCard.id)) {
          setSelectedCard({ ...selectedCard, status: 'revoked' });
        }
      }
    } catch (error: any) {
      console.error('Error al anular:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResendEmail = async (card: CardWithBeneficiary) => {
    if (!card.beneficiary?.email) {
      alert('El beneficiario no tiene un correo electrónico registrado.');
      return;
    }
    
    setResending(card.id);
    try {
      const baseUrl = window.location.origin;
      const cardUrl = `${baseUrl}/validate/${organization?.slug}/${card.id}`;
      
      const { success, error } = await sendCertificateNotification({
        to: card.beneficiary.email,
        name: card.beneficiary.full_name,
        type: 'Tarjeta Digital',
        folio: card.card_number || card.id.split('-')[0],
        rut: card.beneficiary.rut,
        orgName: organization?.name || 'SkardKey',
        url: cardUrl
      });

      if (success) {
        alert('Correo de la tarjeta reenviado correctamente.');
      } else {
        alert(`Error al enviar correo: ${error || 'Desconocido'}`);
      }
    } catch (err) {
      console.error('Error resending email:', err);
      alert('Error inesperado al intentar enviar el correo.');
    } finally {
      setResending(null);
    }
  };

  const handleSendWhatsApp = (item: CardWithBeneficiary) => {
    if (!item.beneficiary?.phone) {
      alert('El beneficiario no tiene un número de teléfono registrado.');
      return;
    }
    
    // Clean phone number (remove +, spaces, etc)
    let phone = item.beneficiary.phone.replace(/\D/g, '');
    
    // Add 569 if it's missing (Chile format common case)
    if (phone.length === 8) phone = `569${phone}`;
    if (phone.length === 9 && phone.startsWith('9')) phone = `56${phone}`;
    
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/validate/${organization?.slug}/${item.id}`;
    
    const firstName = item.beneficiary.full_name.split(' ')[0] || 'Socio(a)';
    const orgName = organization?.name || 'nuestra organización';
    const message = `¡Hola ${firstName}! 🌟 Tu Tarjeta Digital de ${orgName} ya está lista. Puedes visualizarla y descargarla en el siguiente enlace oficial: ${url}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleBulkResendEmail = async () => {
    const cardsToEmail = cards.filter(c => selectedIds.includes(c.id));
    const validCards = cardsToEmail.filter(c => c.beneficiary?.email);
    
    if (validCards.length === 0) {
      alert('Ninguno de los beneficiarios seleccionados tiene un correo electrónico registrado.');
      return;
    }

    if (!confirm(`Se enviarán correos a ${validCards.length} socio(s). ¿Deseas continuar?`)) return;

    setResending('bulk');
    let successCount = 0;
    
    try {
      const baseUrl = window.location.origin;
      
      for (const card of validCards) {
        const cardUrl = `${baseUrl}/validate/${organization?.slug}/${card.id}`;
        const { success } = await sendCertificateNotification({
          to: card.beneficiary.email!,
          name: card.beneficiary.full_name,
          type: 'Tarjeta Digital',
          folio: card.card_number || card.id.split('-')[0],
          rut: card.beneficiary.rut,
          orgName: organization?.name || 'SkardKey',
          url: cardUrl
        });
        if (success) successCount++;
      }

      alert(`Se enviaron ${successCount} de ${validCards.length} correos exitosamente.`);
    } catch (err) {
      console.error('Error in bulk resend:', err);
      alert('Ocurrió un error durante el envío masivo.');
    } finally {
      setResending(null);
      setSelectedIds([]);
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

      {/* Action Bar for Selection */}
      {selectedIds.length > 0 && (
        <div className="glass-card-solid bg-brand-500/10 border-brand-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-brand-400" />
            </div>
            <span className="text-sm font-bold text-brand-300">{selectedIds.length} tarjeta(s) seleccionada(s)</span>
            <button onClick={() => setSelectedIds([])} className="text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors ml-2 bg-white/5 px-2 py-1 rounded">Desmarcar</button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length === 1 && (
              <button
                onClick={() => setSelectedCard(cards.find(c => c.id === selectedIds[0]) || null)}
                className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              >
                <Eye className="w-4 h-4" /> Vista Previa
              </button>
            )}
            <button
              onClick={handleBulkResendEmail}
              disabled={resending === 'bulk'}
              className="btn-ghost bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 px-4 py-2 text-xs font-bold flex items-center gap-2"
            >
              {resending === 'bulk' ? (
                 <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              ) : (
                 <Mail className="w-4 h-4" />
              )}
              Enviar Correo{selectedIds.length > 1 ? 's' : ''}
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => handleBulkStatusChange('active')}
                  disabled={isUpdating}
                  className="btn-ghost bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 px-4 py-2 text-xs font-bold flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" /> Activar
                </button>
                <button
                  onClick={() => handleBulkStatusChange('inactive')}
                  disabled={isUpdating}
                  className="btn-ghost bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 px-4 py-2 text-xs font-bold flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" /> Desactivar
                </button>
                <button
                  onClick={() => handleRevokeCards(selectedIds)}
                  disabled={isUpdating}
                  className="btn-ghost bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 px-4 py-2 text-xs font-bold flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" /> Anular
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT, tarjeta, dirección o nro..."
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
              <option value="inactive">Inactivas</option>
              <option value="expired">Caducadas</option>
              <option value="blocked">Bloqueadas</option>
              <option value="revoked">Revocadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm text-slate-400">
          {cards.length} tarjeta{cards.length !== 1 ? 's' : ''} encontrada{cards.length !== 1 ? 's' : ''}
          {selectedIds.length > 0 && (
            <span className="ml-2 text-brand-400 font-medium">({selectedIds.length} seleccionadas)</span>
          )}
        </div>
        
        {isAdmin && selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-in bg-surface-900 border border-brand-500/20 p-2 rounded-xl">
            <span className="text-sm text-slate-400 mr-2 ml-2 text-[10px] uppercase tracking-wider font-bold">Acciones:</span>
            <button
              onClick={() => handleBulkStatusChange('active')}
              disabled={isUpdating}
              className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md border border-emerald-500/20 transition-colors disabled:opacity-50"
            >
              Activar
            </button>
            <button
              onClick={() => handleBulkStatusChange('inactive')}
              disabled={isUpdating}
              className="px-3 py-1 text-xs bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 rounded-md border border-gray-500/20 transition-colors disabled:opacity-50"
            >
              Inactivar
            </button>
            <button
              onClick={() => handleRevokeCards(selectedIds)}
              disabled={isUpdating}
              className="px-3 py-1 flex items-center gap-1 text-xs bg-red-900/40 text-red-400 hover:bg-red-900/60 rounded-md border border-red-900/50 transition-colors disabled:opacity-50"
            >
              <ShieldAlert className="w-3 h-3" />
              Anular
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
          <table className="data-table text-sm">
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
                <th>Dirección</th>
                <th>Nro.</th>
                <th>N° Tarjeta</th>
                <th>Estado</th>
                <th>Emitida</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
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
                  <td className="text-xs text-slate-400 max-w-[150px] truncate">{c.beneficiary?.address || (c.beneficiary?.custom_fields as any)?.['Dirección'] || '-'}</td>
                  <td className="text-xs font-mono text-slate-400">{c.beneficiary?.address_number || '-'}</td>
                  <td className="font-mono text-xs text-slate-400">{c.card_number}</td>
                  <td><StatusBadge status={c.status} size="sm" /></td>
                  <td className="text-xs text-slate-400">{formatDate(c.issued_at)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleSendWhatsApp(c)}
                        title="Enviar por WhatsApp"
                        className="p-2 rounded-lg text-slate-400 hover:text-[#25D366] hover:bg-[#25D366]/10 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResendEmail(c)}
                        disabled={resending === c.id}
                        title="Reenviar E-mail"
                        className="p-2 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                      >
                        {resending === c.id ? (
                          <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedCard(c)}
                        title="Vista Previa"
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
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
            <div className="grid grid-cols-2 gap-4 text-sm bg-surface-900/30 p-4 rounded-xl border border-white/5">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Número de tarjeta</p>
                <p className="text-white font-mono mt-1">{selectedCard.card_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Código QR (ID)</p>
                <p className="text-white font-mono text-[10px] mt-1 break-all">{selectedCard.qr_code}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Fecha emisión</p>
                <p className="text-white mt-1">{formatDate(selectedCard.issued_at)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Estado Actual</p>
                <div className="mt-1"><StatusBadge status={selectedCard.status} size="sm" /></div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
              <div className="flex gap-2">
                {isAdmin && selectedCard.status !== 'revoked' && (
                  <button
                    onClick={() => handleRevokeCards([selectedCard.id])}
                    disabled={isUpdating}
                    className="px-4 py-2.5 flex items-center gap-2 text-sm font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition-all disabled:opacity-50"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Anular Tarjeta
                  </button>
                )}
                
                <button
                  onClick={() => handleResendEmail(selectedCard)}
                  disabled={resending === selectedCard.id}
                  className="px-4 py-2.5 flex items-center gap-2 text-sm font-bold bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 rounded-xl border border-brand-500/20 transition-all disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {resending === selectedCard.id ? 'Enviando...' : 'Reenviar E-mail'}
                </button>
              </div>

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
                className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {exporting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
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
