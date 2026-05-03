'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, CheckCircle, XCircle, Calendar, Contact, Info, Mail, Hash, User, RefreshCw } from 'lucide-react';
import { formatDate, formatRut } from '@/lib/utils';
import { DigitalCardView } from '@/components/cards/DigitalCardView';
import { exportElementToPDF } from '@/lib/pdfGenerator';
import { Download } from 'lucide-react';

export default function ValidationPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const id = params?.id as string;
  
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<any>(null);
  const [design, setDesign] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function loadData() {
      try {
        // Carga secuencial para evitar bloqueos
        const { data: card, error: cardErr } = await supabase
          .from('digital_cards')
          .select('*')
          .eq('id', id)
          .single();

        if (cardErr || !card) {
          if (isMounted) setError('Credencial no encontrada');
          return;
        }

        // Beneficiario y Org
        const [benRes, orgRes] = await Promise.all([
          supabase.from('beneficiaries').select('*').eq('id', card.beneficiary_id).single(),
          supabase.from('organizations').select('*').eq('id', card.org_id).single()
        ]);

        if (isMounted) {
          setCardData({
            ...card,
            beneficiary: benRes.data,
            organization: orgRes.data
          });
        }

        // Diseño
        const designId = card.metadata?.design_id;
        if (designId) {
          const { data: des } = await supabase
            .from('card_designs')
            .select('*')
            .eq('id', designId)
            .maybeSingle();
          if (isMounted && des) setDesign(des);
        }

      } catch (err) {
        if (isMounted) setError('Error de conexión');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Verificar rol de administrador si el usuario está logueado
  useEffect(() => {
    if (!user || !cardData?.org_id) return;
    supabase.from('org_members')
      .select('role')
      .eq('org_id', cardData.org_id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({data}) => {
        if (data) setUserRole(data.role);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 gap-4">
        <RefreshCw className="w-10 h-10 text-brand-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Certificando validez...</p>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="glass-card-solid p-10 max-w-md w-full text-center space-y-6 border-red-500/20">
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Error de Validación</h1>
            <p className="text-slate-400">{error || 'La credencial no existe o ha sido revocada'}</p>
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { beneficiary, organization, status, issued_at, expires_at } = cardData;
  const isActive = status === 'active';
  const isExpired = expires_at && new Date(expires_at) < new Date();
  const isValid = isActive && !isExpired;
  const isAdmin = userRole === 'owner' || userRole === 'admin' || userRole === 'viewer';

  return (
    <div className="min-h-screen bg-[#050816] text-slate-200 flex flex-col items-center p-4 pt-10 pb-20 overflow-x-hidden">
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 blur-[120px] rounded-full opacity-20 ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>

      <div className="w-full max-w-lg space-y-8 relative z-10">
        
        {/* Validation Status */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20">
            <Shield className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">Blockchain Verified</span>
          </div>
          
          <div className={`glass-card-solid p-10 rounded-[3rem] border-2 transition-all duration-1000 ${isValid ? 'border-green-500/30 shadow-[0_0_60px_-15px_rgba(34,197,94,0.3)]' : 'border-red-500/30 shadow-[0_0_60px_-15px_rgba(239,68,68,0.3)]'}`}>
            {isValid ? (
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4 animate-in zoom-in duration-700" />
            ) : (
              <XCircle className="w-24 h-24 text-red-500 mx-auto mb-4 animate-in zoom-in duration-700" />
            )}
            <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
              {isValid ? 'VÁLIDA' : 'INVÁLIDA'}
            </h1>
            <p className="text-slate-400 font-bold tracking-[0.1em]">{organization?.name?.toUpperCase()}</p>
          </div>
        </div>

        {/* Visual Card Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <Contact className="w-3 h-3" />
              Credencial del Socio
            </h2>
            <button
              onClick={async () => {
                setExporting(true);
                await exportElementToPDF('card-canvas-export', {
                  filename: `credencial-${beneficiary.rut}`,
                  orientation: 'portrait',
                  paperSize: 'a5',
                  scale: 3,
                  margin: 0
                });
                setExporting(false);
              }}
              disabled={exporting}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white flex items-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <div className="w-3 h-3 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              Descargar
            </button>
          </div>
          
          <div id="card-canvas-export" className="glass-card-solid overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl bg-slate-900/40">
            {design ? (
              <div className="aspect-[1.6/1] w-full flex items-center justify-center p-4">
                <DigitalCardView 
                  beneficiary={beneficiary}
                  card={cardData}
                  organization={organization}
                  design={design}
                  compact={true}
                />
              </div>
            ) : (
              <div className="p-12 text-center bg-gradient-to-br from-slate-900 to-slate-950">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{beneficiary?.full_name}</h3>
                <p className="text-brand-400 font-mono text-sm font-bold tracking-widest">{formatRut(beneficiary?.rut)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card-solid p-6 rounded-[2rem] space-y-4">
            <h3 className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Cronología
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Emitida</span>
                <span className="text-white font-semibold">{formatDate(issued_at)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Expiración</span>
                <span className={`font-bold ${isExpired ? 'text-red-400' : 'text-white'}`}>
                  {expires_at ? formatDate(expires_at) : 'Permanente'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card-solid p-6 rounded-[2rem] space-y-4">
            <h3 className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Estado Legal
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Base</span>
                <span className={`font-bold ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {isActive ? 'ACTIVA' : 'INACTIVA'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Vigencia</span>
                <span className={`font-bold ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                  {isValid ? 'AL DÍA' : 'VENCIDA'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Administration Section (Authenticated Only) */}
        {isAdmin && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex items-center gap-2 px-4">
              <div className="h-px flex-1 bg-brand-500/20" />
              <span className="text-[9px] font-black text-brand-400 uppercase tracking-[0.3em] bg-brand-500/5 px-4 py-1 rounded-full border border-brand-500/20">
                Panel Administrativo
              </span>
              <div className="h-px flex-1 bg-brand-500/20" />
            </div>

            <div className="glass-card-solid border-brand-500/20 overflow-hidden rounded-[2.5rem]">
              <div className="bg-brand-500/10 px-6 py-4 border-b border-brand-500/20 flex items-center justify-between">
                <span className="text-xs font-bold text-brand-300 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  DETALLES INTERNOS
                </span>
                <span className="text-[10px] px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 font-black tracking-widest">
                  {userRole?.toUpperCase()}
                </span>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                      <Mail className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Contacto</p>
                      <p className="text-sm text-white font-bold">{beneficiary?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                      <Hash className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Firma Digital (UUID)</p>
                      <p className="text-[10px] font-mono text-slate-500 break-all">{id}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Campos de la Institución</p>
                  <div className="space-y-2">
                    {beneficiary?.custom_fields && Object.entries(beneficiary.custom_fields as any).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{k}</span>
                        <span className="text-xs text-white font-black">{String(v)}</span>
                      </div>
                    ))}
                    {(!beneficiary?.custom_fields || Object.keys(beneficiary.custom_fields as any).length === 0) && (
                      <p className="text-xs text-slate-500 italic text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">Sin atributos adicionales</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Footer */}
        <div className="text-center pt-16 space-y-6">
          <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
            SkardKey garantiza la autenticidad de este documento digital mediante criptografía asimétrica. 
            Cualquier alteración anula la validez del certificado.
          </p>
          <div className="flex justify-center items-center gap-8 opacity-20">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-500" />
            <div className="text-[10px] font-black tracking-[0.5em] text-slate-400">SKARDKEY SECURE</div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
