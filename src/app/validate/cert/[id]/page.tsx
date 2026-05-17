'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, CheckCircle, XCircle, Calendar, FileText, User, RefreshCw, Printer, Download } from 'lucide-react';
import dynamic from 'next/dynamic';

const CanvasPreview = dynamic(
  () => import('@/components/designer/CanvasPreview').then(m => m.CanvasPreview),
  { ssr: false, loading: () => (
    <div className="w-full aspect-[0.7] animate-pulse bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-slate-700 animate-spin" />
    </div>
  )}
);

import { exportElementToPDF } from '@/lib/pdfGenerator';

export default function CertificateValidationPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [populatedDesign, setPopulatedDesign] = useState<any>(null);
  const [containerScale, setContainerScale] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function loadData() {
      try {
        // 1. Fetch certificate with organization and beneficiary (Parallel start)
        const { data: cert, error: certErr } = await supabase
          .from('certificates')
          .select('*, beneficiaries(*), organizations(*)')
          .eq('id', id)
          .single();

        if (certErr || !cert) {
          if (isMounted) setError('Certificado no encontrado');
          return;
        }

        if (isMounted) setCertificate(cert);

        // 2. Fetch the design
        const { data: design, error: designErr } = await supabase
          .from('card_designs')
          .select('*')
          .eq('id', cert.design_id)
          .maybeSingle();

        if (designErr || !design) {
          if (isMounted) setError('Diseño de certificado no encontrado');
          return;
        }

        // 3. Populate design
        const populated = populateCertificate(design, cert, cert.organizations);
        if (isMounted) setPopulatedDesign(populated);

      } catch (err) {
        if (isMounted) setError('Error de conexión');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [id]);

  // Optimized resize handler with requestAnimationFrame
  useEffect(() => {
    if (!populatedDesign) return;

    let rafId: number;
    const updateScale = () => {
      rafId = requestAnimationFrame(() => {
        const container = document.getElementById('cert-scroll-container');
        if (container && populatedDesign) {
          const availableWidth = container.offsetWidth - 32;
          const scale = Math.min(1, availableWidth / populatedDesign.width);
          setContainerScale(scale);
        }
      });
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    // Extra trigger for mobile browsers that might report wrong widths initially
    const timer = setTimeout(updateScale, 500);

    return () => {
      window.removeEventListener('resize', updateScale);
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [populatedDesign]);

  const formatRUT = (rut: string) => {
    if (!rut) return '';
    const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '');
    if (cleanRUT.length < 2) return rut;
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1).toUpperCase();
    return body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + '-' + dv;
  };

  const populateCertificate = (baseDesign: any, cert: any, org: any) => {
    const settings = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {});
    const sigs = settings.signatures || org.signatures || {};

    const data: Record<string, string> = {
      'Folio': cert.folio.toString().padStart(6, '0'),
      'Valor': cert.cost.toLocaleString('es-CL'),
      'Tipo': cert.type === 'socio_activo' ? 'SOCIO ACTIVO' : cert.type === 'socio_inactivo' ? 'SOCIO INACTIVO' : 'RESIDENTE',
      'Nombre receptor': cert.resident_data?.full_name || cert.beneficiaries?.full_name || '',
      'RUT receptor': formatRUT(cert.resident_data?.rut || cert.beneficiaries?.rut || ''),
      'Dirección receptor': [
        cert.resident_data?.address || cert.beneficiaries?.address || 
        cert.beneficiaries?.custom_fields?.['DIRECCIÓN'] || 
        cert.beneficiaries?.custom_fields?.['Dirección'] || 
        cert.beneficiaries?.custom_fields?.['DIRECCION'] || 
        cert.beneficiaries?.custom_fields?.['Direccion'] || 
        cert.beneficiaries?.custom_fields?.['DOMICILIO'] || 
        cert.beneficiaries?.custom_fields?.['Domicilio'] || '',
        cert.resident_data?.address_number || cert.beneficiaries?.address_number || 
        cert.beneficiaries?.custom_fields?.['Nro Dirección'] || ''
      ].filter(Boolean).join(' ') || '',
      'Villa receptor': cert.resident_data?.villa || cert.beneficiaries?.villa || settings.villa || org.villa || '',
      'Comuna': settings.commune || org.commune || '',
      'Provincia': settings.province || '',
      'Región': settings.region || '',
      'Motivo': cert.reason || '',
      'Fecha': new Date(cert.issued_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
      'Nombre Institución': org.name || '',
      'RUT Institución': formatRUT(settings.rut || org.rut || ''),
      'Villa Institución': settings.villa || org.villa || '',
      'Nombre Presidente': sigs.president?.name || settings.president_name || '',
      'Nombre Secretario': sigs.secretary?.name || settings.secretary_name || '',
    };

    const newElements = baseDesign.elements.map((el: any) => {
      if (el.type === 'text') {
        let content = el.data.content;
        Object.entries(data).forEach(([key, value]) => {
          content = content.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
        });
        return { ...el, data: { ...el.data, content } };
      }
      
      if (el.type === 'image') {
        const hourlyTimestamp = Math.floor(Date.now() / 3600000);
        let src = el.data.src;
        const attrKey = (el.data.attributeKey || '').toLowerCase();
        const originalSrc = (el.data.src || '').toLowerCase();
        const dataType = (el.data.type || '').toLowerCase();

        if (attrKey.includes('logo') || originalSrc.includes('logo') || dataType === 'logo') {
          const rawUrl = org.logo_url || settings.logo_url;
          if (rawUrl) src = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}t=${hourlyTimestamp}`;
        } 
        else if (attrKey.includes('firma') || attrKey.includes('signature') || dataType === 'signature' || originalSrc.includes('sig')) {
          let sigUrl = null;
          if (attrKey.includes('presi') || originalSrc.includes('presi')) {
             sigUrl = sigs.president?.signature_url || settings.president_signature_url || org.president_signature_url;
          }
          else if (attrKey.includes('secre') || originalSrc.includes('secre')) {
             sigUrl = sigs.secretary?.signature_url || settings.secretary_signature_url || org.secretary_signature_url;
          }
          else if (dataType === 'signature') {
            const isLeftSide = el.data.x < 50;
            sigUrl = isLeftSide 
              ? (sigs.president?.signature_url || settings.president_signature_url)
              : (sigs.secretary?.signature_url || settings.secretary_signature_url);
          }
          if (sigUrl) src = `${sigUrl}${sigUrl.includes('?') ? '&' : '?'}t=${hourlyTimestamp}`;
        }
        return { ...el, data: { ...el.data, src: src || el.data.src } };
      }

      if (el.type === 'qr') {
        return { ...el, data: { ...el.data, content: `${window.location.origin}/validate/cert/${cert.id}` } };
      }
      return el;
    });

    const cleanElements = newElements.filter((el: any) => 
      !(el.type === 'text' && (
        el.data.content.includes('Folio') || 
        el.data.content.includes('Valor') || 
        el.data.content.includes('Precio') ||
        el.data.content.includes('Art. 210') ||
        el.data.id === 'legal-footer' ||
        el.data.id === 'legal-footer-v2'
      ))
    );

    cleanElements.push({
      type: 'text',
      data: {
        id: 'forced-folio-v4',
        content: `Folio : ${data['Folio']}`,
        x: 72, y: 4, fontSize: 12, fontFamily: "'Inter', sans-serif", fontWeight: '700', color: '#0f172a', textAlign: 'right', isAttribute: false, width: 25, rotation: 0, opacity: 1, letterSpacing: 0, lineHeight: 1.2,
      }
    });

    cleanElements.push({
      type: 'text',
      data: {
        id: 'forced-precio-v4',
        content: `Precio $ : ${data['Valor']}`,
        x: 72, y: 7, fontSize: 12, fontFamily: "'Inter', sans-serif", fontWeight: '700', color: '#0f172a', textAlign: 'right', isAttribute: false, width: 25, rotation: 0, opacity: 1, letterSpacing: 0, lineHeight: 1.2,
      }
    });

    const hasQR = cleanElements.some((el: any) => el.type === 'qr');
    if (!hasQR) {
      cleanElements.push({
        type: 'qr',
        data: {
          id: 'forced-qr', x: 45, y: 87, size: 10, foreground: '#0f172a', background: 'transparent', content: `${window.location.origin}/validate/cert/${cert.id}`
        }
      });
    }

    const finalDesign = { ...baseDesign, width: 794, height: 1123, elements: cleanElements };
    finalDesign.elements.push({
      type: 'text',
      data: {
        id: 'legal-footer-v3',
        content: 'Datos declarados bajo responsabilidad exclusiva del titular. Su falsedad constituye delito penado por el Art. 210 del Código Penal, eximiendo a la emisora de toda responsabilidad. Validación exclusiva vía código QR.',
        x: 10, y: 94, fontSize: 8, fontFamily: "'Inter', sans-serif", fontWeight: '400', color: '#64748b', textAlign: 'center', isAttribute: false, width: 80, rotation: 0, opacity: 1, letterSpacing: 0, lineHeight: 1.4,
      }
    });

    return finalDesign;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 gap-4">
        <RefreshCw className="w-10 h-10 text-brand-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Verificando certificado...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="glass-card-solid p-10 max-w-md w-full text-center space-y-6 border-red-500/20">
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Error de Validación</h1>
            <p className="text-slate-400">{error || 'El certificado no existe o ha sido revocado'}</p>
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-200 flex flex-col items-center p-4 pt-10 pb-20 overflow-x-hidden">
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 blur-[120px] rounded-full opacity-20 bg-emerald-500" />
      </div>

      <div className="w-full max-w-4xl space-y-8 relative z-10">
        
        {/* Validation Status */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Certificado Verificado</span>
          </div>
          
          <div className="glass-card-solid p-8 rounded-[2rem] border-2 border-emerald-500/30 shadow-[0_0_60px_-15px_rgba(34,197,94,0.3)]">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-in zoom-in duration-700" />
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">VÁLIDO</h1>
            <p className="text-slate-400 font-bold tracking-[0.1em] uppercase">{certificate.organizations?.name}</p>
          </div>
        </div>

        {/* Certificate Display */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 w-full justify-center">
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold flex items-center gap-2 border border-white/10 transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button 
              onClick={async () => {
                setExporting(true);
                const folio = certificate.folio.toString().padStart(6, '0');
                await exportElementToPDF('cert-validate-export', {
                  filename: `certificado-${folio}`,
                  orientation: 'portrait', paperSize: 'a4', scale: 2, margin: 5
                });
                setExporting(false);
              }}
              disabled={exporting}
              className="px-5 py-2 bg-brand-500 hover:bg-brand-600 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-colors disabled:opacity-50"
            >
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>

          <div id="cert-scroll-container" className="w-full flex justify-center bg-slate-900/50 rounded-3xl p-4 md:p-8 border border-white/5 overflow-hidden">
            <div 
              id="cert-validate-export"
              className="shadow-2xl origin-top transition-transform duration-300 bg-white"
              style={{ 
                width: `${populatedDesign.width}px`, 
                height: `${populatedDesign.height}px`,
                transform: `scale(${containerScale})`,
                marginBottom: `-${populatedDesign.height * (1 - containerScale)}px`
              }}
            >
              <CanvasPreview design={populatedDesign} selectedElementId={null} readOnly={true} scale={1} />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card-solid p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Documento</p>
              <p className="text-white font-bold">Certificado de Residencia</p>
              <p className="text-xs text-slate-400">Folio #{certificate.folio.toString().padStart(6, '0')}</p>
            </div>
          </div>
          
          <div className="glass-card-solid p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Titular</p>
              <p className="text-white font-bold">{certificate.resident_data?.full_name || certificate.beneficiaries?.full_name}</p>
              <p className="text-xs text-slate-400">{formatRUT(certificate.resident_data?.rut || certificate.beneficiaries?.rut)}</p>
            </div>
          </div>
        </div>

        <div className="text-center text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] pt-10">
          Powered by SkardKey Digital Identity
        </div>
      </div>
    </div>
  );
}
