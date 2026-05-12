'use client';

import { useState, useEffect, useRef} from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, CheckCircle, XCircle, AlertTriangle, Users, FileText, Calendar } from 'lucide-react';
import { formatDate, formatRut } from '@/lib/utils';
import QRScanner from '@/components/scanner/QRScanner';
import { exportReportToPDF } from '@/lib/pdfGenerator';

export default function MeetingDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, organization } = useAuth();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [meeting, setMeeting] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  useEffect(() => { if (id) loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: m } = await supabase.from('meetings').select('*').eq('id', id).single();
      setMeeting(m);
      const { data: atts } = await supabase
        .from('meeting_attendances')
        .select('*, beneficiary:beneficiaries(full_name, rut, email)')
        .eq('meeting_id', id)
        .order('registered_at', { ascending: false });
      setAttendances(atts || []);
      if (m) {
        const { count } = await supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('org_id', m.org_id).eq('status', 'active');
        setTotalBeneficiaries(count || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }

  }

  async function handleScan(cardId: string) {
    if (processing) return;
    setProcessing(true);
    setMessage(null);

    try {
      const { data: card } = await supabase
        .from('digital_cards')
        .select('*, beneficiary:beneficiaries(id, full_name, rut)')
        .eq('id', cardId)
        .single();

      if (!card || !card.beneficiary) {
        setMessage({ type: 'error', text: 'Tarjeta no reconocida' });
        setProcessing(false);
        return;
      }

      // Check duplicate
      const exists = attendances.find(a => a.beneficiary_id === card.beneficiary.id);
      if (exists) {
        setMessage({ type: 'warning', text: `${card.beneficiary.full_name} ya está registrado/a` });
        setProcessing(false);
        return;
      }

      // Register
      const { error } = await supabase.from('meeting_attendances').insert({
        meeting_id: id,
        beneficiary_id: card.beneficiary.id,
        card_id: cardId,
        org_id: meeting.org_id,
        registered_by: user?.id
      });

      if (error) {
        if (error.code === '23505') {
          setMessage({ type: 'warning', text: `${card.beneficiary.full_name} ya fue registrado/a` });
        } else {
          setMessage({ type: 'error', text: 'Error al registrar: ' + error.message });
        }
      } else {
        setMessage({ type: 'success', text: `✓ ${card.beneficiary.full_name} registrado/a correctamente` });
        setAttendances(prev => [{
          id: crypto.randomUUID(),
          beneficiary_id: card.beneficiary.id,
          beneficiary: card.beneficiary,
          registered_at: new Date().toISOString()
        }, ...prev]);
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    }

    setProcessing(false);
  }

  async function closeMeeting() {
    await supabase.from('meetings').update({ status: 'closed' }).eq('id', id);
    setMeeting((prev: any) => ({ ...prev, status: 'closed' }));
  }

  async function generateActaPDF() {
    const pct = totalBeneficiaries > 0 ? Math.round((attendances.length / totalBeneficiaries) * 100) : 0;
    const quorum = pct >= 50;

    await exportReportToPDF({
      filename: `acta_${meeting.name.replace(/\s/g, '_')}`,
      title: 'ACTA OFICIAL DE ASISTENCIA',
      subtitle: `Sesión: ${meeting.name} — Fecha: ${formatDate(meeting.meeting_date)}`,
      orgName: organization?.name,
      logoUrl: organization?.logo_url || undefined,
      orientation: 'portrait',
      summary: [
        { label: 'Socios Inscritos', value: totalBeneficiaries.toString() },
        { label: 'Socios Presentes', value: attendances.length.toString() },
        { label: 'Porcentaje', value: `${pct}%` },
        { label: 'Quórum', value: quorum ? 'ALCANZADO' : 'NO ALCANZADO' }
      ],
      columns: [
        { header: 'N°', key: 'num', width: 10 },
        { header: 'Nombre Completo', key: 'name', width: 45 },
        { header: 'RUT', key: 'rut', width: 25 },
        { header: 'Hora de Registro', key: 'time', width: 20 }
      ],
      data: attendances.map((a, i) => ({
        num: (i + 1).toString(),
        name: a.beneficiary?.full_name || 'N/A',
        rut: formatRut(a.beneficiary?.rut) || 'N/A',
        time: new Date(a.registered_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      }))
    });
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div>;
  if (!meeting) return <div className="text-center text-slate-400 py-20">Reunión no encontrada</div>;

  const pct = totalBeneficiaries > 0 ? Math.round((attendances.length / totalBeneficiaries) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/attendance" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3"><ClipboardList className="w-6 h-6 text-brand-400" /> {meeting.name}</h1>
            <p className="text-slate-400 text-sm flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {formatDate(meeting.meeting_date)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {meeting.status === 'active' && (
            <button onClick={closeMeeting} className="px-4 py-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all font-bold text-sm">Cerrar Reunión</button>
          )}
          <button onClick={generateActaPDF} className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> Acta PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Presentes</p><p className="text-3xl font-black text-green-400 mt-1">{attendances.length}</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Socios</p><p className="text-3xl font-black text-white mt-1">{totalBeneficiaries}</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asistencia</p><p className="text-3xl font-black text-brand-400 mt-1">{pct}%</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quórum</p><p className={`text-3xl font-black mt-1 ${pct >= 50 ? 'text-green-400' : 'text-red-400'}`}>{pct >= 50 ? 'SÍ' : 'NO'}</p></div>
      </div>

      {/* Progress */}
      <div className="glass-card-solid p-4 rounded-2xl">
        <div className="flex justify-between mb-1 text-[10px]"><span className="text-slate-500">0%</span><span className={`font-bold ${pct >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>{pct}%</span><span className="text-slate-500">100%</span></div>
        <div className="bg-slate-800 rounded-full h-3 overflow-hidden relative">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-green-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          <div className="absolute top-0 left-1/2 w-px h-full bg-yellow-500/50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Column */}
        {meeting.status === 'active' && (
          <div>
            <QRScanner
              onScan={handleScan}
              title="Registrar Asistencia"
              subtitle="Escanea la tarjeta de cada socio"
              isProcessing={processing}
            />

            {/* Message */}
            {message && (
              <div className={`mt-4 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300 ${
                message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                message.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' :
                'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> :
                 message.type === 'warning' ? <AlertTriangle className="w-5 h-5 shrink-0" /> :
                 <XCircle className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-bold">{message.text}</p>
              </div>
            )}
          </div>
        )}

        {/* Attendees List Column */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Asistentes ({attendances.length})
          </h3>
          <div className="glass-card-solid rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
            {attendances.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Aún no hay registros</div>
            ) : (
              <div className="divide-y divide-white/5">
                {attendances.map((a, i) => (
                  <div key={a.id || i} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 font-mono w-6">{i + 1}</span>
                      <div>
                        <p className="text-sm text-white font-medium">{a.beneficiary?.full_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{formatRut(a.beneficiary?.rut)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(a.registered_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
