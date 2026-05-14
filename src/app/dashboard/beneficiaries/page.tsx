'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Beneficiary } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatRut } from '@/lib/utils';
import { exportReportToPDF } from '@/lib/pdfGenerator';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  CreditCard,
  Eye,
  User,
  Download,
  FileText,
  CheckSquare,
  Square,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { deleteBeneficiary } from '@/app/actions/beneficiaries';

export default function BeneficiariesPage() {
  const { organization, loading: authLoading, membership } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const isReadOnly = !['owner', 'admin'].includes(membership?.role || '');
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchBeneficiaries = useCallback(async () => {
    if (!organization) return;

    let query = supabase
      .from('beneficiaries')
      .select('*')
      .eq('org_id', organization.id)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,rut.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setBeneficiaries(data);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, statusFilter, search]);

  useEffect(() => {
    if (organization) {
      fetchBeneficiaries();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [organization, authLoading, fetchBeneficiaries]);

  const handleDelete = async (id: string) => {
    if (isReadOnly || !organization) return;
    
    const result = await deleteBeneficiary(id, membership!.user_id, organization.name, organization.id);
    if (result.success) {
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } else {
      alert(`Error al eliminar: ${result.error}`);
    }
    setDeleteModal(null);
  };

  // Selection
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === beneficiaries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(beneficiaries.map(b => b.id)));
    }
  };

  const exportCSV = () => {
    const headers = ['ID Socio', 'RUT', 'Nombres', 'Apellidos', 'Nombre Completo', 'Dirección', 'Comuna', 'Email', 'Teléfono', 'Estado', 'Fecha Registro'];
    const rows = beneficiaries.map((b) => [
      b.id.substring(0, 8),
      formatRut(b.rut),
      b.first_name || '',
      b.last_name || '',
      b.full_name,
      b.address || '',
      b.comuna || '',
      b.email || '',
      b.phone || '',
      b.status,
      formatDate(b.created_at),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map(c => c.includes(',') ? `"${c}"` : c).join(','))].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beneficiarios-${organization?.slug || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    setExportingPDF(true);
    try {
      const activeCount = beneficiaries.filter(b => b.status === 'active').length;
      const inactiveCount = beneficiaries.filter(b => b.status === 'inactive').length;
      const residentCount = beneficiaries.filter(b => {
        const customFields = b.custom_fields || {};
        const tipo = String(customFields['Tipo'] || customFields['tipo'] || '').toLowerCase();
        return tipo.includes('residente');
      }).length;

      await exportReportToPDF({
        filename: `Directorio_Socios_${organization?.slug || 'export'}`,
        title: 'Directorio Oficial de Socios',
        subtitle: 'Listado completo de beneficiarios registrados',
        orgName: organization?.name,
        logoUrl: organization?.logo_url || undefined,
        summary: [
          { label: 'Total Registrados', value: beneficiaries.length.toString() },
          { label: 'Socios Activos', value: activeCount.toString() },
          { label: 'Socios Inactivos', value: inactiveCount.toString() },
          { label: 'Residentes', value: residentCount.toString() }
        ],
        columns: [
          { header: 'RUT', key: 'rut', width: 18 },
          { header: 'Nombre', key: 'name', width: 28 },
          { header: 'Email', key: 'email', width: 25 },
          { header: 'Teléfono', key: 'phone', width: 15 },
          { header: 'Fecha Registro', key: 'date', width: 14 }
        ],
        data: beneficiaries.map(b => ({
          rut: formatRut(b.rut),
          name: b.full_name,
          email: b.email || 'N/A',
          phone: b.phone || '-',
          date: formatDate(b.created_at)
        }))
      });
    } catch (e) {
      console.error('Error exportando PDF', e);
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase">Beneficiarios</h1>
          <div className="flex items-center gap-3 mt-1">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
              <span className="text-[9px] font-bold text-brand-400 font-mono tracking-widest uppercase">Directorio Activo</span>
            </div>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">
              {beneficiaries.length} registros
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Export buttons */}
          <div className="flex bg-surface-900/50 rounded-lg p-1 border border-brand-500/20">
            <button 
              onClick={exportCSV} 
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest font-mono flex items-center gap-2 hover:bg-white/5 rounded-md transition-colors text-slate-300"
              title="Exportar como CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <div className="w-px bg-white/10 mx-1 my-1"></div>
            <button 
              onClick={exportPDF} 
              disabled={exportingPDF}
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest font-mono flex items-center gap-2 hover:bg-white/5 rounded-md transition-colors text-slate-300 disabled:opacity-50"
              title="Exportar como PDF"
            >
              {exportingPDF ? (
                <div className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-brand-400" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>

          {/* Modify selected button */}
          {selectedIds.size === 1 && !isReadOnly && (
            <Link
              href={`/dashboard/beneficiaries/${Array.from(selectedIds)[0]}/edit`}
              className="btn-primary px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest font-mono flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              <Edit className="w-4 h-4" />
              <span>Modificar Datos</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-11 pr-4 py-2.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 sm:block hidden" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input px-4 py-2.5 text-sm min-w-[140px]"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Count + selection info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {beneficiaries.length} beneficiario{beneficiaries.length !== 1 ? 's' : ''} encontrado{beneficiaries.length !== 1 ? 's' : ''}
        </div>
        {selectedIds.size > 0 && (
          <div className="text-sm text-brand-400 font-mono">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="glass-card p-6">
          <LoadingSkeleton rows={8} />
        </div>
      ) : beneficiaries.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No hay beneficiarios"
            description="Emite credenciales desde Emitir Credenciales (manual o masivo) para crear beneficiarios automáticamente."
            action={
              <div className="flex gap-3">
                <Link href="/dashboard/issue" className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
                  Emitir Manual
                </Link>
                <Link href="/dashboard/issue?tab=masivo" className="btn-secondary px-5 py-2.5 text-sm">
                  Carga Masiva
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="glass-card-solid border-white/5 overflow-hidden hidden md:block shadow-2xl relative">
            <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-brand-500/20 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-brand-500/20 pointer-events-none" />
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-950/50 border-b border-white/5">
                    <th className="px-4 py-4 w-10">
                      <button onClick={toggleSelectAll} className="text-slate-500 hover:text-brand-400 transition-colors">
                        {selectedIds.size === beneficiaries.length && beneficiaries.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-brand-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono w-14">Foto</th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono w-20">ID Socio</th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono w-32">RUT</th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono min-w-[120px]">Nombres</th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono min-w-[120px]">Apellidos</th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono min-w-[160px]">Dirección</th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono w-28">Comuna</th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono min-w-[160px]">Correo</th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono w-32">Celular</th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono w-24">Estado</th>
                    <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono text-right w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.map((person) => {
                    const isSelected = selectedIds.has(person.id);
                    return (
                    <tr key={person.id} className={`group border-b border-white/5 hover:bg-brand-500/[0.03] transition-colors ${isSelected ? 'bg-brand-500/[0.06]' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(person.id)} className="text-slate-500 hover:text-brand-400 transition-colors">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-surface-900 border-2 border-brand-500/20 shadow-lg flex-shrink-0 group-hover:border-brand-500/40 transition-all duration-300">
                          {person.photo_url ? (
                            <Image
                              src={person.photo_url}
                              alt={person.full_name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-brand-500/5">
                              <User className="w-6 h-6 text-brand-400 opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-[11px] font-mono font-bold text-brand-400 tracking-wider bg-brand-500/5 px-2 py-1 rounded border border-brand-500/10">
                          {(person.custom_fields as any)?.['ID Socio'] || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="font-mono text-brand-300 text-[11px] font-bold bg-brand-500/10 px-2 py-1 rounded border border-brand-500/20 whitespace-nowrap shadow-sm">
                          {formatRut(person.rut)}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-white text-sm font-bold tracking-tight">
                          {person.first_name || person.full_name.split(' ')[0] || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-white text-sm font-bold tracking-tight">
                          {person.last_name || person.full_name.split(' ').slice(1).join(' ') || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-slate-400 text-[11px] font-medium truncate max-w-[180px] block leading-tight">
                          {person.address || (person.custom_fields as any)?.['Dirección'] || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-slate-400 text-xs">
                          {person.comuna || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-slate-300 text-xs truncate max-w-[150px] block">
                          {person.email || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-slate-400 text-[11px] font-mono whitespace-nowrap bg-white/5 px-2 py-1 rounded border border-white/5">
                          {person.phone || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4"><StatusBadge status={person.status} size="sm" /></td>
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {!isReadOnly && (
                            <Link
                              href={`/dashboard/beneficiaries/${person.id}/edit`}
                              className="p-2 rounded-lg btn-ghost hover:bg-white/5 transition-all"
                              title="Modificar datos"
                            >
                              <Edit className="w-3.5 h-3.5 text-brand-400" />
                            </Link>
                          )}
                          <Link
                            href={`/dashboard/beneficiaries/${person.id}`}
                            className="p-2 rounded-lg btn-ghost hover:bg-white/5 transition-all"
                            title="Ver detalle"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                          {!isReadOnly && (
                            <button
                              onClick={() => setDeleteModal(person.id)}
                              className="p-2 rounded-lg btn-ghost hover:bg-red-500/10 transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {beneficiaries.map((person) => {
              const isSelected = selectedIds.has(person.id);
              return (
              <div key={person.id} className={`glass-card-solid p-5 relative overflow-hidden group ${isSelected ? 'border-brand-500/30' : ''}`}>
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand-500/30" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-brand-500/30" />

                <div className="flex items-start gap-3">
                  {/* Selection checkbox */}
                  <button onClick={() => toggleSelect(person.id)} className="mt-1 text-slate-500 hover:text-brand-400 transition-colors flex-shrink-0">
                    {isSelected ? <CheckSquare className="w-5 h-5 text-brand-400" /> : <Square className="w-5 h-5" />}
                  </button>

                  {/* Photo */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-900 border-2 border-brand-500/20 flex-shrink-0">
                    {person.photo_url ? (
                      <Image src={person.photo_url} alt={person.full_name} width={56} height={56} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-7 h-7 text-brand-400 opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white tracking-tight text-sm">{person.full_name}</h3>
                    <p className="text-xs font-mono text-brand-400 tracking-wider mt-0.5">{formatRut(person.rut)}</p>
                    
                    <div className="grid grid-cols-1 gap-1 mt-2">
                      {person.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="text-[11px] text-slate-400 truncate">{person.email}</span>
                        </div>
                      )}
                      {person.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="text-[11px] text-slate-400">{person.phone}</span>
                        </div>
                      )}
                      {(person.address || person.comuna) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="text-[11px] text-slate-400 truncate">
                            {person.address}{person.address && person.comuna ? ', ' : ''}{person.comuna}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setActionMenu(actionMenu === person.id ? null : person.id)}
                      className="p-2 rounded-xl btn-ghost hover:bg-white/5"
                    >
                      <MoreHorizontal className="w-5 h-5 text-slate-400" />
                    </button>
                    {actionMenu === person.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                        <div className="absolute right-0 top-full mt-2 w-52 glass-card-solid rounded-2xl p-2 z-20 animate-scale-in border-brand-500/30 shadow-2xl">
                          {!isReadOnly && (
                            <Link
                              href={`/dashboard/beneficiaries/${person.id}/edit`}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-slate-300 hover:bg-brand-500/10 transition-colors"
                            >
                              <Edit className="w-4 h-4 text-brand-400" /> Modificar Datos
                            </Link>
                          )}
                          <Link
                            href={`/dashboard/beneficiaries/${person.id}`}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-slate-300 hover:bg-brand-500/10 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-slate-400" /> Ver Perfil
                          </Link>
                          {!isReadOnly && (
                            <button
                              onClick={() => { setDeleteModal(person.id); setActionMenu(null); }}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 w-full text-left"
                            >
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <StatusBadge status={person.status} size="sm" />
                  <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">ID: {person.id.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>
            );
            })}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Confirmar eliminación"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-slate-300 mb-6">
            ¿Estás seguro de que deseas eliminar este beneficiario? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setDeleteModal(null)}
              className="btn-secondary px-6 py-2.5 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteModal && handleDelete(deleteModal)}
              className="btn-danger px-6 py-2.5 text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
