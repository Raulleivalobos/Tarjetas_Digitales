'use client';

import { useState, useEffect, useRef} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Benefit } from '@/lib/types';
import Link from 'next/link';
import { Gift, Plus, Eye, QrCode, BarChart3, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, CalendarPlus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function BenefitsPage() {
  const { organization, loading: authLoading } = useAuth();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showExtend, setShowExtend] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [form, setForm] = useState({ name: '', description: '', type: 'subsidy', total_quantity: '', start_date: '', end_date: '' });
  const [assignMode, setAssignMode] = useState<'all' | 'select'>('all');
  const [selectedBens, setSelectedBens] = useState<string[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [organization, authLoading]);

  async function loadData() {
    if (!organization) return;
    setLoading(true);
    const { data: bens } = await supabase.from('benefits').select('*').eq('org_id', organization!.id).order('created_at', { ascending: false });
    // Get assignment counts
    const enriched = await Promise.all((bens || []).map(async (b: any) => {
      const { count: total } = await supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('benefit_id', b.id);
      const { count: delivered } = await supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('benefit_id', b.id).eq('status', 'used');
      return { ...b, assignedCount: total || 0, deliveredCount: delivered || 0 };
    }));
    setBenefits(enriched);
    const { data: benList } = await supabase.from('beneficiaries').select('id, full_name, rut').eq('org_id', organization!.id).eq('status', 'active');
    setBeneficiaries(benList || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.name || !organization) return;
    setSaving(true);
    const qty = form.total_quantity ? parseInt(form.total_quantity) : null;
    const { data: newBenefit, error } = await supabase.from('benefits').insert({
      org_id: organization.id, name: form.name, description: form.description || null,
      type: form.type, total_quantity: qty, remaining_quantity: qty,
      start_date: form.start_date || null, end_date: form.end_date || null, status: 'active'
    }).select().single();

    if (error || !newBenefit) { setSaving(false); console.error('Error al crear beneficio:', error); return; }

    // Assign
    const targets = assignMode === 'all' ? beneficiaries.map(b => b.id) : selectedBens;
    if (targets.length > 0) {
      const assignments = targets.map(bid => ({ benefit_id: newBenefit.id, beneficiary_id: bid, org_id: organization.id, status: 'pending' }));
      await supabase.from('benefit_assignments').insert(assignments);
    }
    setForm({ name: '', description: '', type: 'subsidy', total_quantity: '', start_date: '', end_date: '' });
    setShowCreate(false);
    setSaving(false);
    loadData();
  }

  async function handleExtend(benefitId: string) {
    if (!extendDate) return;
    await supabase.from('benefits').update({ extended_end_date: extendDate, extension_reason: extendReason || null }).eq('id', benefitId);
    setShowExtend(null); setExtendDate(''); setExtendReason('');
    loadData();
  }

  function getEffectiveEndDate(b: any) {
    return b.extended_end_date || b.end_date;
  }

  function getStatusBadge(b: any) {
    const endDate = getEffectiveEndDate(b);
    if (endDate && new Date(endDate) < new Date()) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">VENCIDO</span>;
    if (b.status === 'exhausted') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">AGOTADO</span>;
    if (b.status === 'active') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">ACTIVO</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">INACTIVO</span>;
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3"><Gift className="w-8 h-8 text-brand-400" /> Gestión de Beneficios</h1>
          <p className="text-slate-400 mt-1">Crea, asigna y controla la entrega de beneficios a tus socios</p>
        </div>
        <div className="flex gap-3">
          {benefits.find(b => b.status === 'active') && (
            <Link href={`/dashboard/benefits/${benefits.find(b => b.status === 'active')!.id}`} className="px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all font-bold text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Entregar con QR
            </Link>
          )}
          <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> Crear Beneficio
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Beneficios</p><p className="text-2xl font-black text-white mt-1">{benefits.length}</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activos</p><p className="text-2xl font-black text-green-400 mt-1">{benefits.filter(b => b.status === 'active').length}</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Asignados</p><p className="text-2xl font-black text-brand-400 mt-1">{benefits.reduce((a, b) => a + b.assignedCount, 0)}</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Entregados</p><p className="text-2xl font-black text-purple-400 mt-1">{benefits.reduce((a, b) => a + b.deliveredCount, 0)}</p></div>
      </div>

      {/* Benefits List */}
      <div className="space-y-4">
        {benefits.length === 0 && <div className="glass-card-solid p-12 rounded-2xl text-center"><Gift className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No hay beneficios creados aún</p></div>}
        {benefits.map(b => {
          const progress = b.assignedCount > 0 ? Math.round((b.deliveredCount / b.assignedCount) * 100) : 0;
          const effectiveEnd = getEffectiveEndDate(b);
          return (
            <div key={b.id} className="glass-card-solid p-6 rounded-2xl border border-white/5 hover:border-brand-500/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{b.name}</h3>
                    {getStatusBadge(b)}
                    {b.extended_end_date && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">PRORROGADO</span>}
                  </div>
                  {b.description && <p className="text-sm text-slate-400 mb-2">{b.description}</p>}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Inicio: {b.start_date ? formatDate(b.start_date) : 'Sin fecha'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Fin: {effectiveEnd ? formatDate(effectiveEnd) : 'Sin fecha'}</span>
                    <span className="capitalize px-2 py-0.5 rounded bg-white/5">{b.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="text-2xl font-black text-white">{b.deliveredCount}<span className="text-slate-500 text-sm">/{b.assignedCount}</span></p>
                    <p className="text-[10px] text-slate-500 uppercase">Entregados</p>
                  </div>
                  {b.status === 'active' && b.deliveredCount < b.assignedCount && (
                    <Link href={`/dashboard/benefits/${b.id}`} className="px-3 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all text-xs font-bold flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" /> Escanear QR
                    </Link>
                  )}
                  <button onClick={() => setShowExtend(b.id)} className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all" title="Prorrogar"><CalendarPlus className="w-4 h-4" /></button>
                  <Link href={`/dashboard/benefits/${b.id}`} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all" title="Ver detalle"><Eye className="w-4 h-4" /></Link>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 text-right">{progress}% completado</p>

              {/* Extend modal */}
              {showExtend === b.id && (
                <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                  <p className="text-sm font-bold text-blue-400">Prorrogar Beneficio</p>
                  <input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm" />
                  <input type="text" placeholder="Motivo de prórroga (opcional)" value={extendReason} onChange={e => setExtendReason(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => handleExtend(b.id)} className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold">Guardar Prórroga</button>
                    <button onClick={() => setShowExtend(null)} className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-sm">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card-solid p-8 rounded-3xl max-w-lg w-full space-y-6 border border-brand-500/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-brand-400" /> Crear Beneficio</h2>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase">Nombre *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="Ej: Canasta Familiar Navidad" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">Descripción</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Tipo</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"><option value="subsidy">Subsidio</option><option value="bonus">Bono</option><option value="aid">Ayuda</option><option value="other">Otro</option></select></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Cantidad Total</label><input type="number" value={form.total_quantity} onChange={e => setForm({...form, total_quantity: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="Ilimitado" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Fecha Inicio</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Fecha Término</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" /></div>
              </div>
              {/* Assignment mode */}
              <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 space-y-3">
                <p className="text-sm font-bold text-brand-300">Asignar a:</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={assignMode === 'all'} onChange={() => setAssignMode('all')} className="accent-brand-500" /><span className="text-sm text-white">Todos los socios ({beneficiaries.length})</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={assignMode === 'select'} onChange={() => setAssignMode('select')} className="accent-brand-500" /><span className="text-sm text-white">Seleccionar</span></label>
                </div>
                {assignMode === 'select' && (
                  <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                    {beneficiaries.map(ben => (
                      <label key={ben.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                        <input type="checkbox" checked={selectedBens.includes(ben.id)} onChange={e => setSelectedBens(e.target.checked ? [...selectedBens, ben.id] : selectedBens.filter(x => x !== ben.id))} className="accent-brand-500" />
                        <span className="text-sm text-white">{ben.full_name}</span>
                        <span className="text-xs text-slate-500">{ben.rut}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreate} disabled={saving || !form.name} className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all disabled:opacity-50">{saving ? 'Creando...' : 'Crear y Asignar'}</button>
              <button onClick={() => setShowCreate(false)} className="px-6 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
