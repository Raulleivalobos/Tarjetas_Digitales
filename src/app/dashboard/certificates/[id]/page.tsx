'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  ShieldCheck,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { CanvasPreview } from '@/components/designer/CanvasPreview';
import { CardDesign, DesignElement } from '@/lib/cardDesignTypes';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { exportElementToPDF } from '@/lib/pdfGenerator';
import Link from 'next/link';

export default function ViewCertificatePage() {
  const { id } = useParams();
  const router = useRouter();
  const { organization } = useAuth();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<any>(null);
  const [design, setDesign] = useState<CardDesign | null>(null);
  const [populatedDesign, setPopulatedDesign] = useState<CardDesign | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!organization || !id) return;
      
      try {
        // 1. Fetch certificate
        const { data: cert, error: certError } = await supabase
          .from('certificates')
          .select('*, beneficiaries(*)')
          .eq('id', id)
          .single();

        if (certError) throw certError;
        setCertificate(cert);

        // 2. Fetch the specific design used for this certificate
        const { data: designs, error: designError } = await supabase
          .from('card_designs')
          .select('*')
          .eq('id', cert.design_id)
          .limit(1);

        if (designError || !designs || designs.length === 0) {
           // Fallback: If for some reason the specific design is missing, try to find any design
           const { data: fallbackDesigns } = await supabase
             .from('card_designs')
             .select('*')
             .eq('org_id', organization.id)
             .limit(1);
           
           if (!fallbackDesigns || fallbackDesigns.length === 0) {
             setLoading(false);
             return;
           }
           setDesign(fallbackDesigns[0]);
           const populated = populateCertificate(fallbackDesigns[0], cert, organization);
           setPopulatedDesign(populated);
        } else {
          const baseDesign = designs[0];
          setDesign(baseDesign);
          const populated = populateCertificate(baseDesign, cert, organization);
          setPopulatedDesign(populated);
        }

      } catch (err) {
        console.error('Error fetching certificate view:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, organization]);

  const formatRUT = (rut: string) => {
    if (!rut) return '';
    const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '');
    if (cleanRUT.length < 2) return rut;
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1).toUpperCase();
    return body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + '-' + dv;
  };

  const populateCertificate = (baseDesign: CardDesign, cert: any, org: any) => {
    const activeOrg = (organization && organization.id === cert.org_id) ? organization : org;
    const settings = typeof activeOrg.settings === 'string' ? JSON.parse(activeOrg.settings) : (activeOrg.settings || {});
    const sigs = settings.signatures || activeOrg.signatures || {};

    const data: Record<string, string> = {
      'Folio': cert.folio.toString().padStart(6, '0'),
      'Valor': cert.cost.toLocaleString('es-CL'),
      'Tipo': cert.type === 'socio_activo' ? 'SOCIO ACTIVO' : cert.type === 'socio_inactivo' ? 'SOCIO INACTIVO' : 'RESIDENTE',
      'Nombre receptor': cert.resident_data?.full_name || cert.beneficiaries?.full_name || '',
      'RUT receptor': formatRUT(cert.resident_data?.rut || cert.beneficiaries?.rut || ''),
      'Dirección receptor': cert.resident_data?.address || cert.beneficiaries?.address || 
                           cert.beneficiaries?.custom_fields?.['DIRECCIÓN'] || 
                           cert.beneficiaries?.custom_fields?.['Dirección'] || 
                           cert.beneficiaries?.custom_fields?.['DIRECCION'] || 
                           cert.beneficiaries?.custom_fields?.['Direccion'] || 
                           cert.beneficiaries?.custom_fields?.['DOMICILIO'] || 
                           cert.beneficiaries?.custom_fields?.['Domicilio'] || '',
      'Villa receptor': cert.resident_data?.villa || cert.beneficiaries?.villa || settings.villa || activeOrg.villa || '',
      'Comuna': settings.commune || activeOrg.commune || '',
      'Provincia': settings.province || '',
      'Región': settings.region || '',
      'Motivo': cert.reason || '',
      'Fecha': new Date(cert.issued_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
      'Nombre Institución': activeOrg.name || '',
      'RUT Institución': formatRUT(settings.rut || activeOrg.rut || ''),
      'Villa Institución': settings.villa || activeOrg.villa || '',
      'Nombre Presidente': sigs.president?.name || settings.president_name || '',
      'Nombre Secretario': sigs.secretary?.name || settings.secretary_name || '',
    };

    const newElements = baseDesign.elements.map(el => {
      // Handle Text Elements
      if (el.type === 'text') {
        let content = el.data.content;
        Object.entries(data).forEach(([key, value]) => {
          content = content.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
        });
        return { ...el, data: { ...el.data, content } };
      }
      
      // Handle Image Elements (Logos & Signatures)
      if (el.type === 'image') {
        const timestamp = new Date().getTime();
        let src = el.data.src;
        const attrKey = (el.data.attributeKey || '').toLowerCase();
        const originalSrc = (el.data.src || '').toLowerCase();
        const dataType = (el.data.type || '').toLowerCase();

        // LOGO
        if (attrKey.includes('logo') || originalSrc.includes('logo') || dataType === 'logo') {
          const rawUrl = activeOrg.logo_url || settings.logo_url;
          if (rawUrl) src = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
        } 
        // SIGNATURES - check attributeKey, src, AND data.type
        else if (attrKey.includes('firma') || attrKey.includes('signature') || dataType === 'signature' || originalSrc.includes('sig')) {
          let sigUrl = null;
          // President
          if (attrKey.includes('presi') || originalSrc.includes('presi')) {
             sigUrl = sigs.president?.signature_url || settings.president_signature_url || activeOrg.president_signature_url;
          }
          // Secretary
          else if (attrKey.includes('secre') || originalSrc.includes('secre')) {
             sigUrl = sigs.secretary?.signature_url || settings.secretary_signature_url || activeOrg.secretary_signature_url;
          }
          // Fallback: if type is 'signature' but no president/secretary match, try both
          else if (dataType === 'signature') {
            // Check element position: left side = president, right side = secretary
            const isLeftSide = el.data.x < 50;
            sigUrl = isLeftSide 
              ? (sigs.president?.signature_url || settings.president_signature_url)
              : (sigs.secretary?.signature_url || settings.secretary_signature_url);
          }
          if (sigUrl) src = `${sigUrl}${sigUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
        }

        return { ...el, data: { ...el.data, src: src || el.data.src } };
      }

      // QR Code
      if (el.type === 'qr') {
        return {
          ...el,
          data: {
            ...el.data,
            content: `${window.location.origin}/validate/cert/${cert.id}`
          }
        };
      }
      
      return el;
    });

    // STRICT CLEANUP: Remove any existing Folio, Valor, Precio or Legal Footer elements
    const cleanElements = newElements.filter(el => 
      !(el.type === 'text' && (
        el.data.content.includes('Folio') || 
        el.data.content.includes('Valor') || 
        el.data.content.includes('Precio') ||
        el.data.content.includes('Art. 210') ||
        el.data.id === 'legal-footer' ||
        el.data.id === 'legal-footer-v2'
      ))
    );

    // FOLIO (first line, top right)
    cleanElements.push({
      type: 'text',
      data: {
        id: 'forced-folio-v4',
        content: `Folio : ${data['Folio']}`,
        x: 72,
        y: 4,
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
        fontWeight: '700',
        color: '#0f172a',
        textAlign: 'right',
        isAttribute: false,
        width: 25,
        rotation: 0,
        opacity: 1,
        letterSpacing: 0,
        lineHeight: 1.2,
      }
    });

    // PRECIO (second line, just below folio)
    cleanElements.push({
      type: 'text',
      data: {
        id: 'forced-precio-v4',
        content: `Precio $ : ${data['Valor']}`,
        x: 72,
        y: 7,
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
        fontWeight: '700',
        color: '#0f172a',
        textAlign: 'right',
        isAttribute: false,
        width: 25,
        rotation: 0,
        opacity: 1,
        letterSpacing: 0,
        lineHeight: 1.2,
      }
    });

    // ENSURE QR CODE
    const hasQR = cleanElements.some(el => el.type === 'qr');
    if (!hasQR) {
      cleanElements.push({
        type: 'qr',
        data: {
          id: 'forced-qr',
          x: 45,
          y: 87,
          size: 10,
          foreground: '#0f172a',
          background: 'transparent',
          content: `${window.location.origin}/validate/cert/${cert.id}`
        }
      });
    }

    // Forced A4 proportions
    const finalDesign = {
      ...baseDesign,
      width: 794,
      height: 1123,
      elements: cleanElements
    };

    // ALWAYS ADD LEGAL FOOTER (Slightly higher for guaranteed visibility)
    finalDesign.elements.push({
      type: 'text',
      data: {
        id: 'legal-footer-v3',
        content: 'Datos declarados bajo responsabilidad exclusiva del titular. Su falsedad constituye delito penado por el Art. 210 del Código Penal, eximiendo a la emisora de toda responsabilidad. Validación exclusiva vía código QR.',
        x: 10,
        y: 94, // Moved up from 96
        fontSize: 8,
        fontFamily: "'Inter', sans-serif",
        fontWeight: '400',
        color: '#64748b',
        textAlign: 'center',
        isAttribute: false,
        width: 80,
        rotation: 0,
        opacity: 1,
        letterSpacing: 0,
        lineHeight: 1.4,
      }
    });

    return finalDesign;
  };

  const [containerScale, setContainerScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const container = document.getElementById('cert-scroll-container');
      if (container && populatedDesign) {
        const availableWidth = container.offsetWidth - 32;
        const scale = Math.min(1, availableWidth / populatedDesign.width);
        setContainerScale(scale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [populatedDesign]);

  if (loading) return <PageSkeleton />;

  if (!populatedDesign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="w-16 h-16 text-amber-500" />
        <h2 className="text-xl font-bold text-white">No se encontró un diseño</h2>
        <Link href="/dashboard/designs" className="btn-primary px-6 py-2">Ir a Diseños</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/certificates" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Certificado Folio #{certificate?.folio}
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Válido</span>
            </h1>
            <p className="text-sm text-slate-400">Vista previa del documento oficial generado.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="btn-ghost px-4 py-2 text-sm font-bold flex items-center gap-2 border border-white/10"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button 
            onClick={async () => {
              setExporting(true);
              const folio = certificate?.folio?.toString().padStart(6, '0') || '';
              await exportElementToPDF('cert-canvas-export', {
                filename: `certificado-${folio}`,
                orientation: 'portrait',
                paperSize: 'a4',
                scale: 2,
                margin: 5
              });
              setExporting(false);
            }}
            disabled={exporting}
            className="btn-primary px-5 py-2 text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {exporting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
            ) : (
              <><Download className="w-4 h-4" /> Descargar PDF</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div id="cert-scroll-container" className="xl:col-span-3 flex justify-center bg-slate-900/50 rounded-3xl p-4 md:p-8 border border-white/5 overflow-hidden">
          <div 
            id="cert-canvas-export"
            className="shadow-2xl origin-top transition-transform duration-300"
            style={{ 
              width: `${populatedDesign.width}px`, 
              height: `${populatedDesign.height}px`,
              transform: `scale(${containerScale})`,
              marginBottom: `-${populatedDesign.height * (1 - containerScale)}px`
            }}
          >
            <CanvasPreview 
              design={populatedDesign} 
              selectedElementId={null} 
              readOnly={true}
              scale={1}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Detalles de Emisión</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Validación QR</p>
                  <p className="text-xs text-white leading-relaxed">Este documento cuenta con validación digital única vía código QR.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Integridad</p>
                  <p className="text-xs text-white leading-relaxed">Firmas electrónicas de directiva incorporadas automáticamente.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-500 uppercase font-bold">Recaudado</span>
                <span className="text-lg font-black text-emerald-400">${certificate?.cost?.toLocaleString('es-CL')}</span>
              </div>
              <button className="w-full btn-ghost py-2 text-xs font-bold flex items-center justify-center gap-2 border border-white/5">
                <Share2 className="w-3 h-3" /> Compartir Enlace
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Aviso de Impresión</span>
            </div>
            <p className="text-[10px] text-blue-300/70 leading-relaxed">
              Para una impresión óptima, asegúrese de seleccionar el tamaño de papel "A4" en la configuración de su impresora y desactivar los márgenes del navegador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
