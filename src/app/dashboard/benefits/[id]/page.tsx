'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Gift, CheckCircle, Clock, FileText, AlertTriangle, XCircle } from 'lucide-react';
import { formatDate, formatRut } from '@/lib/utils';
import QRScanner from '@/components/scanner/QRScanner';

export default function BenefitDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, organization } = useAuth();
  const supabase = createClient();
  const [benefit, setBenefit] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'used'>('all');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  useEffect(() => { if (id) loadDetail(); }, [id]);

  async function loadDetail() {
    setLoading(true);
    const { data: b } = await supabase.from('benefits').select('*').eq('id', id).single();
    setBenefit(b);
    const { data: assigns } = await supabase.from('benefit_assignments').select('*, beneficiary:beneficiaries(full_name, rut, email)').eq('benefit_id', id).order('assigned_at', { ascending: false });
    setAssignments(assigns || []);
    setLoading(false);
  }

  async function handleScan(cardId: string) {
    if (processing) return;
    setProcessing(true);
    setMessage(null);

    try {
      const { data: card } = await supabase
        .from('digital_cards')
        .select('*, beneficiary:beneficiaries(id, full_name, rut)')
        .eq('id', cardId).single();

      if (!card || !card.beneficiary) {
        setMessage({ type: 'error', text: 'Tarjeta no reconocida' });
        setProcessing(false);
        return;
      }

      // Find the assignment for this beneficiary + this benefit
      const assignment = assignments.find(a => a.beneficiary_id === card.beneficiary.id);
      if (!assignment) {
        setMessage({ type: 'warning', text: `${card.beneficiary.full_name} no tiene asignado este beneficio` });
        setProcessing(false);
        return;
      }

      if (assignment.status === 'used') {
        setMessage({ type: 'warning', text: `${card.beneficiary.full_name} ya recibió este beneficio el ${formatDate(assignment.used_at)}` });
        setProcessing(false);
        return;
      }

      // Mark as delivered
      const { error } = await supabase.from('benefit_assignments')
        .update({ status: 'used', used_at: new Date().toISOString(), validated_by: user?.id })
        .eq('id', assignment.id);

      if (error) {
        setMessage({ type: 'error', text: 'Error al marcar entrega' });
      } else {
        setMessage({ type: 'success', text: `✓ ${card.beneficiary.full_name} — Beneficio entregado correctamente` });
        setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, status: 'used', used_at: new Date().toISOString() } : a));
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
    setProcessing(false);
  }

  function getFiltered() {
    if (filter === 'pending') return assignments.filter(a => a.status === 'pending');
    if (filter === 'used') return assignments.filter(a => a.status === 'used');
    return assignments;
  }

  async function generatePDF() {
    const jsPDF = (await import('jspdf')).default;
    await import('jspdf-autotable');
    const doc = new jsPDF();
    const orgName = organization?.name || 'Organización';
    const effectiveEnd = benefit.extended_end_date || benefit.end_date;
    const delivered = assignments.filter(a => a.status === 'used').length;
    const pending = assignments.filter(a => a.status === 'pending').length;
    const pct = assignments.length > 0 ? Math.round((delivered / assignments.length) * 100) : 0;

    doc.setFontSize(18); doc.text('INFORME FINAL DE BENEFICIO', 14, 22);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(orgName, 14, 30);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, 36);
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`Beneficio: ${benefit.name}`, 14, 48);
    doc.setFontSize(10);
    doc.text(`Tipo: ${benefit.type} | Estado: ${benefit.status}`, 14, 55);
    doc.text(`Periodo: ${benefit.start_date ? formatDate(benefit.start_date) : 'N/A'} - ${effectiveEnd ? formatDate(effectiveEnd) : 'N/A'}`, 14, 61);
    if (benefit.extended_end_date) doc.text(`Prórroga: ${formatDate(benefit.extended_end_date)} | Motivo: ${benefit.extension_reason || 'N/A'}`, 14, 67);

    const statsY = benefit.extended_end_date ? 78 : 72;
    doc.setFontSize(12); doc.text('RESUMEN', 14, statsY);
    doc.setFontSize(10);
    doc.text(`Total: ${assignments.length} | Entregados: ${delivered} (${pct}%) | Pendientes: ${pending}`, 14, statsY + 8);

    const tableData = assignments.map((a, i) => [i + 1, a.beneficiary?.full_name || 'N/A', a.beneficiary?.rut || 'N/A', a.status === 'used' ? 'ENTREGADO' : 'PENDIENTE', a.used_at ? new Date(a.used_at).toLocaleDateString('es-CL') : '-']);
    (doc as any).autoTable({ startY: statsY + 18, head: [['#', 'Nombre', 'RUT', 'Estado', 'Fecha']], body: tableData, theme: 'grid', headStyles: { fillColor: [99, 102, 241] }, styles: { fontSize: 8 } });
    doc.save(`informe_${benefit.name.replace(/\s/g, '_')}.pdf`);
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div>;
  if (!benefit) return <div className="text-center text-slate-400 py-20">Beneficio no encontrado</div>;

  const delivered = assignments.filter(a => a.status === 'used').length;
  const pending = assignments.filter(a => a.status === 'pending').length;
  const progress = assignments.length > 0 ? Math.round((delivered / assignments.length) * 100) : 0;
  const filtered = getFiltered();
  const isActive = benefit.status === 'active';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/benefits" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3"><Gift className="w-6 h-6 text-brand-400" /> {benefit.name}</h1>
            <p className="text-slate-400 text-sm">{benefit.description}</p>
          </div>
        </div>
        <button onClick={generatePDF} className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" /> Informe PDF
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asignados</p><p className="text-3xl font-black text-white mt-1">{assignments.length}</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entregados</p><p className="text-3xl font-black text-green-400 mt-1">{delivered}</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pendientes</p><p className="text-3xl font-black text-yellow-400 mt-1">{pending}</p></div>
        <div className="glass-card-solid p-5 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progreso</p><p className="text-3xl font-black text-brand-400 mt-1">{progress}%</p></div>
      </div>

      {/* Progress */}
      <div className="glass-card-solid p-4 rounded-2xl">
        <div className="flex justify-between mb-1 text-[10px]"><span className="text-slate-500">0%</span><span className="text-slate-500">100%</span></div>
        <div className="bg-slate-800 rounded-full h-3 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-green-500 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Column */}
        {isActive && pending > 0 && (
          <div>
            <QRScanner
              onScan={handleScan}
              title="Entregar Beneficio"
              subtitle={`Escanea la tarjeta para entregar "${benefit.name}"`}
              isProcessing={processing}
            />
            {message && (
              <div className={`mt-4 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300 ${
                message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                message.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' :
                'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : message.type === 'warning' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-bold">{message.text}</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments List Column */}
        <div>
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            {(['all', 'pending', 'used'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                {f === 'all' ? `Todos (${assignments.length})` : f === 'pending' ? `Pendientes (${pending})` : `Entregados (${delivered})`}
              </button>
            ))}
          </div>

          <div className="glass-card-solid rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Sin registros</div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered.map(a => (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm text-white font-medium">{a.beneficiary?.full_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{formatRut(a.beneficiary?.rut)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.status === 'used' ? (
                        <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-400 font-bold">Entregado</span></>
                      ) : (
                        <><Clock className="w-3.5 h-3.5 text-yellow-500" /><span className="text-xs text-yellow-400 font-bold">Pendiente</span></>
                      )}
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
