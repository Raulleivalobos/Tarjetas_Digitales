'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ClipboardList, Plus, Eye, Calendar, Users, BarChart3, CheckCircle, QrCode } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AttendancePage() {
  const { organization, user, loading: authLoading } = useAuth();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', meeting_date: '' });
  const [saving, setSaving] = useState(false);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0);

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
    const { data: mList } = await supabase.from('meetings').select('*').eq('org_id', organization!.id).order('meeting_date', { ascending: false });
    const { count } = await supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('org_id', organization!.id).eq('status', 'active');
    setTotalBeneficiaries(count || 0);

    const enriched = await Promise.all((mList || []).map(async (m: any) => {
      const { count: attendees } = await supabase.from('meeting_attendances').select('*', { count: 'exact', head: true }).eq('meeting_id', m.id);
      return { ...m, attendeeCount: attendees || 0 };
    }));
    setMeetings(enriched);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.name || !form.meeting_date || !organization) return;
    setSaving(true);
    const { error } = await supabase.from('meetings').insert({
      org_id: organization.id, name: form.name, description: form.description || null,
      meeting_date: form.meeting_date, status: 'active', created_by: user?.id
    });
    if (error) { alert('Error al crear reunión'); setSaving(false); return; }
    setForm({ name: '', description: '', meeting_date: '' });
    setShowCreate(false);
    setSaving(false);
    loadData();
  }

  async function closeMeeting(meetingId: string) {
    await supabase.from('meetings').update({ status: 'closed' }).eq('id', meetingId);
    loadData();
  }

  // Find the first active meeting for quick access
  const activeMeeting = meetings.find(m => m.status === 'active');

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3"><ClipboardList className="w-8 h-8 text-brand-400" /> Control de Asistencia</h1>
          <p className="text-slate-400 mt-1">Crea reuniones y registra la asistencia de tus socios con QR</p>
        </div>
        <div className="flex gap-3">
          {activeMeeting && (
            <Link href={`/dashboard/attendance/${activeMeeting.id}`} className="px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all font-bold text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Registrar Asistencia QR
            </Link>
          )}
          <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> Nueva Reunión
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Reuniones</p><p className="text-2xl font-black text-white mt-1">{meetings.length}</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Socios Registrados</p><p className="text-2xl font-black text-brand-400 mt-1">{totalBeneficiaries}</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Promedio Asistencia</p><p className="text-2xl font-black text-green-400 mt-1">{meetings.length > 0 && totalBeneficiaries > 0 ? Math.round(meetings.reduce((a, m) => a + m.attendeeCount, 0) / meetings.length / totalBeneficiaries * 100) : 0}%</p></div>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.length === 0 && <div className="glass-card-solid p-12 rounded-2xl text-center"><ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No hay reuniones creadas</p></div>}
        {meetings.map(m => {
          const pct = totalBeneficiaries > 0 ? Math.round((m.attendeeCount / totalBeneficiaries) * 100) : 0;
          return (
            <div key={m.id} className="glass-card-solid p-6 rounded-2xl border border-white/5 hover:border-brand-500/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{m.name}</h3>
                    {m.status === 'active' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">ABIERTA</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">CERRADA</span>
                    )}
                  </div>
                  {m.description && <p className="text-sm text-slate-400 mb-2">{m.description}</p>}
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(m.meeting_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="text-2xl font-black text-white">{m.attendeeCount}<span className="text-slate-500 text-sm">/{totalBeneficiaries}</span></p>
                    <p className="text-[10px] text-brand-400 font-bold">{pct}% asistencia</p>
                  </div>
                  {m.status === 'active' && (
                    <>
                      <Link href={`/dashboard/attendance/${m.id}`} className="px-3 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all text-xs font-bold flex items-center gap-1.5">
                        <QrCode className="w-4 h-4" /> Escanear QR
                      </Link>
                      <button onClick={() => closeMeeting(m.id)} className="p-2 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all" title="Cerrar reunión"><CheckCircle className="w-4 h-4" /></button>
                    </>
                  )}
                  <Link href={`/dashboard/attendance/${m.id}`} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all" title="Ver detalle"><Eye className="w-4 h-4" /></Link>
                </div>
              </div>
              {/* Progress */}
              <div className="mt-4 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-green-500 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card-solid p-8 rounded-3xl max-w-lg w-full space-y-6 border border-brand-500/20" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-brand-400" /> Nueva Reunión</h2>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase">Nombre de la Reunión *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="Ej: Asamblea General Ordinaria" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">Descripción</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" rows={2} /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">Fecha y Hora *</label><input type="datetime-local" value={form.meeting_date} onChange={e => setForm({...form, meeting_date: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreate} disabled={saving || !form.name || !form.meeting_date} className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all disabled:opacity-50">{saving ? 'Creando...' : 'Crear Reunión'}</button>
              <button onClick={() => setShowCreate(false)} className="px-6 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
