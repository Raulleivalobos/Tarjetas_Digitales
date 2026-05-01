'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Gift, CheckCircle, XCircle, AlertTriangle, Truck } from 'lucide-react';
import { formatDate, formatRut } from '@/lib/utils';
import QRScanner from '@/components/scanner/QRScanner';

export default function DeliverBenefitPage() {
  const { user, organization } = useAuth();
  const supabase = createClient();
  const [scannedBeneficiary, setScannedBeneficiary] = useState<any>(null);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deliveryLog, setDeliveryLog] = useState<Array<{ name: string; benefit: string; time: string }>>([]);

  async function handleScan(cardId: string) {
    if (processing) return;
    setProcessing(true);
    setMessage(null);

    try {
      // Find the card and its beneficiary
      const { data: card } = await supabase
        .from('digital_cards')
        .select('*, beneficiary:beneficiaries(*)')
        .eq('id', cardId)
        .single();

      if (!card || !card.beneficiary) {
        setMessage({ type: 'error', text: 'Tarjeta no encontrada o no válida' });
        setProcessing(false);
        return;
      }

      if (card.status !== 'active') {
        setMessage({ type: 'warning', text: 'Esta tarjeta está inactiva o bloqueada' });
        setProcessing(false);
        return;
      }

      setScannedBeneficiary(card.beneficiary);

      // Get pending benefit assignments
      const { data: assigns } = await supabase
        .from('benefit_assignments')
        .select('*, benefit:benefits(name, type, end_date, extended_end_date)')
        .eq('beneficiary_id', card.beneficiary.id)
        .eq('status', 'pending');

      setPendingAssignments(assigns || []);

      if (!assigns || assigns.length === 0) {
        setMessage({ type: 'warning', text: `${card.beneficiary.full_name} no tiene beneficios pendientes` });
      } else {
        setMessage({ type: 'success', text: `${card.beneficiary.full_name} — ${assigns.length} beneficio(s) pendiente(s)` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al buscar datos del socio' });
    }

    setProcessing(false);
  }

  async function deliverBenefit(assignmentId: string, benefitName: string) {
    setDelivering(assignmentId);
    const { error } = await supabase
      .from('benefit_assignments')
      .update({ status: 'used', used_at: new Date().toISOString(), validated_by: user?.id })
      .eq('id', assignmentId);

    if (error) {
      setMessage({ type: 'error', text: 'Error al marcar como entregado' });
    } else {
      setMessage({ type: 'success', text: '¡Beneficio marcado como ENTREGADO!' });
      setPendingAssignments(prev => prev.filter(a => a.id !== assignmentId));
      setDeliveryLog(prev => [
        { name: scannedBeneficiary?.full_name, benefit: benefitName, time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) },
        ...prev
      ]);
    }
    setDelivering(null);
  }

  function resetScan() {
    setScannedBeneficiary(null);
    setPendingAssignments([]);
    setMessage(null);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/benefits" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Truck className="w-6 h-6 text-green-400" /> Entrega de Beneficios
          </h1>
          <p className="text-slate-400 text-sm">Escanea el QR de la tarjeta del socio para entregar beneficios</p>
        </div>
      </div>

      {/* QR Scanner */}
      <QRScanner
        onScan={handleScan}
        title="Escanear Tarjeta del Socio"
        subtitle="Apunta al QR de la tarjeta para ver los beneficios pendientes"
        isProcessing={processing}
      />

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300 ${
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

      {/* Scanned beneficiary info */}
      {scannedBeneficiary && (
        <div className="glass-card-solid p-6 rounded-2xl border border-brand-500/20 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <span className="text-2xl font-black text-white">{scannedBeneficiary.full_name?.[0]}</span>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{scannedBeneficiary.full_name}</p>
              <p className="text-sm text-slate-400 font-mono">{formatRut(scannedBeneficiary.rut)}</p>
            </div>
          </div>

          {/* Pending benefits */}
          {pendingAssignments.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Beneficios Pendientes de Entrega</p>
              {pendingAssignments.map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand-500/20 transition-all">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <Gift className="w-4 h-4 text-brand-400" /> {a.benefit?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Vence: {a.benefit?.extended_end_date ? formatDate(a.benefit.extended_end_date) : a.benefit?.end_date ? formatDate(a.benefit.end_date) : 'Sin fecha'}
                    </p>
                  </div>
                  <button
                    onClick={() => deliverBenefit(a.id, a.benefit?.name)}
                    disabled={delivering === a.id}
                    className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95 shadow-lg shadow-green-500/20"
                  >
                    {delivering === a.id ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Entregando...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Entregar</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={resetScan} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-sm transition-all">
            Escanear otro socio
          </button>
        </div>
      )}

      {/* Delivery Log */}
      {deliveryLog.length > 0 && (
        <div className="glass-card-solid rounded-2xl overflow-hidden">
          <div className="bg-green-500/10 px-6 py-3 border-b border-green-500/20">
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Registro de Entregas ({deliveryLog.length})</span>
          </div>
          <div className="divide-y divide-white/5">
            {deliveryLog.map((log, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{log.name}</p>
                  <p className="text-xs text-slate-500">{log.benefit}</p>
                </div>
                <span className="text-xs text-green-400 font-mono">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
