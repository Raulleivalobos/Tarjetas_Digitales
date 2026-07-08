'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Ban, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Certificate } from '@/lib/types';
import Link from 'next/link';

export default function AnnulValidationPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    async function fetchCertificate() {
      try {
        const { data, error: fetchErr } = await supabase
          .from('certificates')
          .select('*, organizations(*), beneficiaries(*)')
          .eq('annulment_token', token)
          .single();

        if (fetchErr || !data) {
          setError('Enlace inválido, caducado, o el certificado ya fue anulado.');
        } else {
          setCertificate(data);
        }
      } catch (err) {
        setError('Error de conexión.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCertificate();
  }, [token, supabase]);

  const handleConfirmAnnulment = async () => {
    if (!certificate) return;
    
    setIsConfirming(true);
    try {
      const { error: updateError } = await supabase
        .from('certificates')
        .update({
          status: 'annulled',
          annulment_token: null // Invalidar el token después de usarlo
        })
        .eq('id', certificate.id)
        .eq('annulment_token', token);

      if (updateError) {
        throw updateError;
      }
      
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al intentar anular el certificado. Puede que los permisos de seguridad (RLS) impidan la actualización. Contacte a soporte.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mb-4" />
        <p className="text-slate-400">Verificando enlace seguro...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Solicitud Inválida</h1>
          <p className="text-slate-400">{error}</p>
          <div className="pt-6">
            <Link href="/" className="btn-primary w-full flex justify-center py-3 font-bold">
              Ir al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Certificado Anulado</h1>
          <p className="text-slate-400">El certificado folio <strong>#{certificate.folio}</strong> ha sido anulado oficialmente en el sistema.</p>
          <div className="pt-6">
            <p className="text-xs text-slate-500 mb-4">Ya puedes cerrar esta ventana.</p>
            <Link href="/" className="btn-ghost w-full flex justify-center py-3 font-bold border border-white/5">
              Volver
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Ban className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Autorizar Anulación</h1>
          <p className="text-slate-400 text-sm">Estás a punto de anular definitivamente este certificado emitido.</p>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">Folio</span>
            <span className="text-brand-400 font-mono font-bold">#{certificate.folio}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">Vecino</span>
            <span className="text-white font-medium text-right">
              {certificate.resident_data?.full_name || (certificate as any).beneficiaries?.full_name || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">Fecha Emisión</span>
            <span className="text-slate-300 text-sm">{formatDateTime(certificate.issued_at)}</span>
          </div>
          <div className="pt-2">
            <span className="block text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">Motivo de la solicitud</span>
            <p className="text-white text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              {certificate.annulment_reason || 'No especificado'}
            </p>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <button
            onClick={handleConfirmAnnulment}
            disabled={isConfirming}
            className="w-full btn-danger py-3.5 font-bold flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(248,113,113,0.15)] disabled:opacity-50"
          >
            {isConfirming ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Procesando...</>
            ) : (
              <>Autorizar Anulación <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
          <p className="text-[10px] text-center text-slate-500">Esta acción es irreversible y anulará oficialmente el documento.</p>
        </div>
      </div>
    </div>
  );
}
