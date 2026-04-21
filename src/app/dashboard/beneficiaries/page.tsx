'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Beneficiary } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatRut, validateRut } from '@/lib/utils';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  CreditCard,
  Eye,
  User,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function BeneficiariesPage() {
  const { organization } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const supabase = createClient();

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
      query = query.or(`full_name.ilike.%${search}%,rut.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setBeneficiaries(data);
    }
    setLoading(false);
  }, [organization, statusFilter, search, supabase]);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('beneficiaries').delete().eq('id', id);
    if (!error) {
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    }
    setDeleteModal(null);
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'RUT', 'Email', 'Teléfono', 'Estado', 'Fecha Registro'];
    const rows = beneficiaries.map((b) => [
      b.full_name,
      b.rut,
      b.email || '',
      b.phone || '',
      b.status,
      formatDate(b.created_at),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beneficiarios-${organization?.slug || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Beneficiarios</h1>
          <p className="text-slate-400 mt-1">
            Gestiona los miembros de tu organización
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="btn-secondary px-4 py-2.5 text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <Link
            href="/dashboard/beneficiaries/new"
            className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Beneficiario</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
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

      {/* Count */}
      <div className="text-sm text-slate-400">
        {beneficiaries.length} beneficiario{beneficiaries.length !== 1 ? 's' : ''} encontrado{beneficiaries.length !== 1 ? 's' : ''}
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
            description="Comienza agregando beneficiarios a tu organización. Puedes hacerlo manualmente o mediante carga masiva."
            action={
              <div className="flex gap-3">
                <Link href="/dashboard/beneficiaries/new" className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar Beneficiario
                </Link>
                <Link href="/dashboard/bulk-upload" className="btn-secondary px-5 py-2.5 text-sm">
                  Carga Masiva
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="glass-card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Beneficiario</th>
                    <th>RUT</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.map((person) => (
                    <tr key={person.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-900 border border-brand-500/10 flex-shrink-0">
                            {person.photo_url ? (
                              <Image
                                src={person.photo_url}
                                alt={person.full_name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-600" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-white">{person.full_name}</span>
                        </div>
                      </td>
                      <td className="font-mono text-slate-300">{formatRut(person.rut)}</td>
                      <td>
                        <div className="text-slate-400 text-xs">
                          {person.email && <div>{person.email}</div>}
                          {person.phone && <div>{person.phone}</div>}
                          {!person.email && !person.phone && '-'}
                        </div>
                      </td>
                      <td><StatusBadge status={person.status} size="sm" /></td>
                      <td className="text-slate-400 text-xs">{formatDate(person.created_at)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/beneficiaries/${person.id}`}
                            className="p-2 rounded-lg btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/beneficiaries/${person.id}/edit`}
                            className="p-2 rounded-lg btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/cards?beneficiary=${person.id}`}
                            className="p-2 rounded-lg btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Ver tarjeta"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModal(person.id)}
                            className="p-2 rounded-lg btn-ghost opacity-0 group-hover:opacity-100 transition-opacity hover:!text-red-400"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {beneficiaries.map((person) => (
              <div key={person.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-900 border border-brand-500/10 flex-shrink-0">
                      {person.photo_url ? (
                        <Image
                          src={person.photo_url}
                          alt={person.full_name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{person.full_name}</h3>
                      <p className="text-xs font-mono text-slate-400">{formatRut(person.rut)}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === person.id ? null : person.id)}
                      className="p-2 rounded-lg btn-ghost"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {actionMenu === person.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 glass-card-solid rounded-xl p-2 z-20 animate-scale-in">
                        <Link
                          href={`/dashboard/beneficiaries/${person.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/[0.05]"
                        >
                          <Eye className="w-4 h-4" /> Ver detalle
                        </Link>
                        <Link
                          href={`/dashboard/beneficiaries/${person.id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/[0.05]"
                        >
                          <Edit className="w-4 h-4" /> Editar
                        </Link>
                        <button
                          onClick={() => { setDeleteModal(person.id); setActionMenu(null); }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full"
                        >
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-500/5">
                  <StatusBadge status={person.status} size="sm" />
                  <span className="text-xs text-slate-500">{formatDate(person.created_at)}</span>
                </div>
              </div>
            ))}
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
