'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Benefit } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Modal } from '@/components/ui/Modal';
import { formatDate, getBenefitTypeLabel } from '@/lib/utils';
import {
  Gift,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
} from 'lucide-react';

export default function BenefitsPage() {
  const { organization } = useAuth();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const supabase = createClient();

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentBenefit, setCurrentBenefit] = useState<Benefit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'subsidy' as const,
    total_quantity: '',
    start_date: '',
    end_date: '',
    status: 'active' as const,
  });

  const fetchBenefits = async () => {
    if (!organization) return;
    setLoading(true);

    let query = supabase
      .from('benefits')
      .select('*')
      .eq('org_id', organization.id)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setBenefits(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBenefits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, search]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('benefits').delete().eq('id', id);
    if (!error) {
      setBenefits((prev) => prev.filter((b) => b.id !== id));
    }
    setDeleteModal(null);
  };

  const handleOpenForm = (mode: 'create' | 'edit', benefit?: Benefit) => {
    setFormMode(mode);
    if (mode === 'edit' && benefit) {
      setCurrentBenefit(benefit);
      setFormData({
        name: benefit.name,
        description: benefit.description || '',
        type: benefit.type as any,
        total_quantity: benefit.total_quantity?.toString() || '',
        start_date: benefit.start_date ? benefit.start_date.split('T')[0] : '',
        end_date: benefit.end_date ? benefit.end_date.split('T')[0] : '',
        status: benefit.status as any,
      });
    } else {
      setCurrentBenefit(null);
      setFormData({
        name: '',
        description: '',
        type: 'subsidy',
        total_quantity: '',
        start_date: '',
        end_date: '',
        status: 'active',
      });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    const payload = {
      org_id: organization.id,
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      total_quantity: formData.total_quantity ? parseInt(formData.total_quantity, 10) : null,
      remaining_quantity: formData.total_quantity ? parseInt(formData.total_quantity, 10) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      status: formData.status,
    };

    if (formMode === 'create') {
      const { error } = await supabase.from('benefits').insert(payload);
      if (!error) {
        setIsFormOpen(false);
        fetchBenefits();
      }
    } else if (formMode === 'edit' && currentBenefit) {
      // Don't update remaining_quantity on edit to avoid resetting it unintentionally.
      // A more robust implementation would handle adjusting remaining based on total change.
      const { remaining_quantity, ...updatePayload } = payload;
      const { error } = await supabase
        .from('benefits')
        .update(updatePayload)
        .eq('id', currentBenefit.id);

      if (!error) {
        setIsFormOpen(false);
        fetchBenefits();
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Beneficios</h1>
          <p className="text-slate-400 mt-1">Gestiona los subsidios y bonos para tu organización</p>
        </div>
        <button
          onClick={() => handleOpenForm('create')}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Beneficio</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar beneficios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-11 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card p-6"><LoadingSkeleton rows={5} /></div>
      ) : benefits.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<Gift className="w-8 h-8" />}
            title="No hay beneficios"
            description="Crea tu primer beneficio, como un subsidio de salud o un bono escolar."
            action={
              <button
                onClick={() => handleOpenForm('create')}
                className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear Beneficio
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit) => (
            <div key={benefit.id} className="glass-card p-5 relative group">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setActionMenu(actionMenu === benefit.id ? null : benefit.id)}
                  className="p-1.5 rounded-lg btn-ghost"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {actionMenu === benefit.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 glass-card-solid rounded-xl p-2 z-20 animate-scale-in">
                    <button
                      onClick={() => { handleOpenForm('edit', benefit); setActionMenu(null); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/[0.05] w-full text-left"
                    >
                      <Edit className="w-4 h-4" /> Editar
                    </button>
                    <button
                      onClick={() => { setDeleteModal(benefit.id); setActionMenu(null); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full text-left"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mb-4 pr-8">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white truncate">{benefit.name}</h3>
                  <p className="text-xs text-slate-500">{getBenefitTypeLabel(benefit.type)}</p>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[40px]">
                {benefit.description || 'Sin descripción'}
              </p>

              <div className="space-y-3 mb-4">
                {benefit.total_quantity !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Disponibles</span>
                    <span className="text-white font-medium">
                      {benefit.remaining_quantity} / {benefit.total_quantity}
                    </span>
                  </div>
                )}
                {benefit.end_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Vigencia hasta</span>
                    <span className="text-white">{formatDate(benefit.end_date)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-brand-500/10">
                <StatusBadge status={benefit.status} size="sm" />
                <button className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium">
                  <Users className="w-3 h-3" />
                  Asignar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'create' ? 'Nuevo Beneficio' : 'Editar Beneficio'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="glass-input w-full px-4 py-2.5 text-sm"
              placeholder="Ej: Bono Escolar 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-input w-full px-4 py-2.5 text-sm resize-none h-24"
              placeholder="Detalles del beneficio..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="glass-input w-full px-4 py-2.5 text-sm"
              >
                <option value="subsidy">Subsidio</option>
                <option value="bonus">Bonificación</option>
                <option value="aid">Ayuda Social</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Cantidad Total</label>
              <input
                type="number"
                min="1"
                value={formData.total_quantity}
                onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                className="glass-input w-full px-4 py-2.5 text-sm"
                placeholder="Opcional (ilimitado)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="glass-input w-full px-4 py-2.5 text-sm text-slate-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="glass-input w-full px-4 py-2.5 text-sm text-slate-300"
              />
            </div>
            {formMode === 'edit' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="glass-input w-full px-4 py-2.5 text-sm"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="exhausted">Agotado</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-500/10 mt-6">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="btn-secondary px-5 py-2.5 text-sm"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary px-5 py-2.5 text-sm">
              Guardar Beneficio
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Confirmar eliminación"
        size="sm"
      >
        <div className="text-center">
          <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4 p-2 bg-red-500/10 rounded-full" />
          <p className="text-slate-300 mb-6">
            ¿Eliminar este beneficio? Las asignaciones existentes podrían verse afectadas.
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setDeleteModal(null)} className="btn-secondary px-5 py-2 text-sm">
              Cancelar
            </button>
            <button
              onClick={() => deleteModal && handleDelete(deleteModal)}
              className="btn-danger px-5 py-2 text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
