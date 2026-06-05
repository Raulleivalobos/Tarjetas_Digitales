'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/app/actions/audit';
import { 
  ArrowLeft, 
  Search, 
  User, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Save,
  DollarSign,
  Building,
  UserPlus,
  Eye,
  X,
  Check
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { Beneficiary, CertificateType } from '@/lib/types';
import { sendCertificateNotification } from '@/app/actions/email';
import dynamic from 'next/dynamic';
const CanvasPreview = dynamic(
  () => import('@/components/designer/CanvasPreview').then(m => m.CanvasPreview),
  { ssr: false, loading: () => <div className="w-full h-full animate-pulse bg-white/5 rounded-lg" /> }
);

const REASONS = [
  'Certificación de Domicilio',
  'Trámite General',
  'Motivos Laborales',
  'Educación',
  'Subsidios'
];

export default function IssueCertificatePage() {
  const router = useRouter();
  const { organization, user, membership } = useAuth();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Beneficiary[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Use custom reasons from organization settings if available
  const availableReasons = organization?.settings?.reasons || REASONS;

  const [formData, setFormData] = useState({
    type: 'socio_activo' as CertificateType,
    reason: '', 
    resident_data: {
      full_name: '',
      rut: '',
      address: '',
      villa: '',
      email: '',
    },
    cost: 500,
  });

  const prices = organization?.settings?.certificate_prices || {
    active: 500,
    inactive: 1000,
    resident: 2000,
  };

  // Fetch available designs
  useEffect(() => {
    const fetchDesigns = async () => {
      if (!organization) return;
      try {
        const { data } = await supabase
        .from('card_designs')
        .select('*')
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false });
      
      const results = (data || []).map(d => ({
        ...d,
        additionalInfo: d.additional_info || []
      })) as any[];

      // Filter specifically for certificates (design_type column may not exist)
      const certificateDesigns = results.filter((d: any) => 
        d.name.toLowerCase().includes('certificado') || 
        d.name.toLowerCase().includes('residencia') ||
        (d.design_type && d.design_type === 'certificate')
      );

      setDesigns(certificateDesigns);
        
        // Auto-select first certificate or any available
        if (certificateDesigns.length > 0) {
          setSelectedDesignId(certificateDesigns[0].id);
        }
      } catch (err) {
        console.error('Error fetching designs:', err);
      }
    };
    fetchDesigns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  // Set default reason when reasons are loaded
  useEffect(() => {
    if (availableReasons.length > 0 && !formData.reason) {
      setFormData(prev => ({ ...prev, reason: availableReasons[0] }));
    }
  }, [availableReasons, formData.reason]);

  useEffect(() => {
    // Auto-update price when type or beneficiary changes
    if (formData.type === 'residente') {
      setFormData(prev => ({ ...prev, cost: prices.resident }));
    } else if (selectedBeneficiary) {
      const price = selectedBeneficiary.status === 'active' ? prices.active : prices.inactive;
      setFormData(prev => ({ 
        ...prev, 
        type: selectedBeneficiary.status === 'active' ? 'socio_activo' : 'socio_inactivo',
        cost: price 
      }));
    }
  }, [formData.type, selectedBeneficiary, prices]);

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (val.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const cleanVal = val.replace(/\D/g, '');
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('org_id', organization?.id)
        .or(`full_name.ilike.%${val}%,rut.ilike.%${val}%,rut.ilike.%${cleanVal}%`)
        .limit(5);

      if (error) throw error;
      const results = data || [];
      setSearchResults(results);

      const exactMatch = results.find((b: any) => 
        b.rut.replace(/\D/g, '') === cleanVal || 
        b.rut.toLowerCase() === val.toLowerCase()
      );
      if (exactMatch) {
        setSelectedBeneficiary(exactMatch);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const [formError, setFormError] = useState('');

  const handleConfirm = () => {
    setFormError('');
    if (!organization || !selectedDesignId) {
      setFormError('Debes seleccionar un modelo de certificado antes de emitir.');
      return;
    }
    if (formData.type === 'residente' && !formData.resident_data.full_name) {
      setFormError('Debes ingresar el nombre del residente.');
      return;
    }
    if (formData.type !== 'residente' && !selectedBeneficiary) {
      setFormError('Debes seleccionar un socio de la lista de resultados de búsqueda.');
      return;
    }
    setShowConfirm(true);
  };

  const handleDirectIssue = () => {
    setFormError('');
    if (!organization || !selectedDesignId) {
      setFormError('Debes seleccionar un modelo de certificado antes de emitir.');
      return;
    }
    if (formData.type === 'residente' && !formData.resident_data.full_name) {
      setFormError('Debes ingresar el nombre del residente.');
      return;
    }
    if (formData.type !== 'residente' && !selectedBeneficiary) {
      setFormError('Debes seleccionar un socio de la lista de resultados de búsqueda.');
      return;
    }
    handleIssue();
  };

  const handleIssue = async () => {
    if (!organization || !selectedDesignId) return;
    setLoading(true);
    setShowConfirm(false);

    try {
      const { data: folio, error: folioError } = await supabase.rpc('increment_org_folio', {
        target_org_id: organization.id
      });

      if (folioError) throw folioError;

      const certData = {
        org_id: organization.id,
        beneficiary_id: selectedBeneficiary?.id || null,
        design_id: selectedDesignId,
        folio: folio,
        type: formData.type,
        reason: formData.reason,
        cost: formData.cost,
        status: 'active',
        resident_data: formData.resident_data,
        metadata: {
          issued_by: (await supabase.auth.getUser()).data.user?.id,
          org_info: { name: organization.name, rut: organization.rut },
          signatures: typeof organization.settings === 'string' 
            ? JSON.parse(organization.settings)?.signatures 
            : (organization.settings as any)?.signatures
        }
      };

      const { data: newCert, error: insertError } = await supabase.from('certificates').insert(certData).select('id').single();
      if (insertError) throw insertError;

      // Intentar enviar notificación por email si hay un destinatario
      const email = formData.type === 'residente' ? formData.resident_data.email : selectedBeneficiary?.email;
      if (email && newCert) {
        try {
          await sendCertificateNotification({
            to: email,
            name: recipientName,
            type: 'CERTIFICADO DE RESIDENCIA',
            folio: folio.toString().padStart(6, '0'),
            rut: recipientRut,
            orgName: organization.name,
            url: `${window.location.origin}/validate/cert/${newCert.id}`
          });
        } catch (emailErr) {
          console.error('Error enviando notificación:', emailErr);
          // No bloqueamos el flujo principal si el correo falla
        }
      }

      await logActivity({
        orgId: organization.id,
        userId: membership!.user_id,
        userEmail: user?.email || 'unknown',
        action: 'ISSUE_CERTIFICATE',
        entityType: 'certificate',
        details: { 
          certificate_id: newCert?.id, 
          folio: folio,
          recipient: recipientName,
          type: formData.type,
          cost: formData.cost
        }
      });

      router.push('/dashboard/certificates');
    } catch (err) {
      console.error('Error issuing certificate:', err);
      setFormError('Error al emitir. Verifica la conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getPopulatedDesign = () => {
    const selectedDesign = designs.find(d => d.id === selectedDesignId);
    if (!selectedDesign || !selectedDesign.elements) return null;
    
    try {
      const elements = [...selectedDesign.elements];
      const previewDate = new Date().toLocaleDateString('es-CL');

      return {
        ...selectedDesign,
        elements: elements.map((el: any) => {
          if (!el.data) return el;
          
          if (el.type === 'text') {
            let val = el.data.content || '';
            
            // Handle explicit attributes first
            if (el.data.isAttribute) {
              const attrKey = el.data.attributeKey?.trim().toUpperCase();
              if (attrKey) {
                if (attrKey === 'NOMBRE RECEPTOR' || attrKey === 'NOMBRE') val = recipientName || val;
                else if (attrKey === 'NOMBRE INSTITUCIÓN' || attrKey === 'ORGANIZACION') val = organization?.name || val;
                else if (attrKey === 'RUT') val = recipientRut || val;
                else if (attrKey === 'FECHA') val = previewDate;
                else if (attrKey === 'MOTIVO') val = formData.reason || val;
                else if (attrKey === 'COMUNA') val = organization?.settings?.commune || val;
              }
            }
            
            // Replace inline [Placeholders]
            let formattedRut = recipientRut ? recipientRut.replace(/[^0-9kK]/g, '') : '';
            if (formattedRut.length > 1) {
              const body = formattedRut.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
              const dv = formattedRut.slice(-1).toUpperCase();
              formattedRut = `${body}-${dv}`;
            }
            const replacements: Record<string, string> = {
              '\\[Nombre receptor\\]': recipientName || '',
              '\\[RUT receptor\\]': formattedRut,
              '\\[Dirección receptor\\]': formData.type === 'residente'
                ? [formData.resident_data.address, formData.resident_data.address_number].filter(Boolean).join(' ')
                : [selectedBeneficiary?.address, (selectedBeneficiary as any)?.address_number].filter(Boolean).join(' ') || (selectedBeneficiary?.custom_fields as any)?.['Dirección'] || 'No registrado',
              '\\[Villa receptor\\]': organization?.villa || organization?.settings?.villa || organization?.name || '',
              '\\[Comuna\\]': organization?.settings?.commune || organization?.commune || '',
              '\\[Provincia\\]': organization?.settings?.province || '',
              '\\[Región\\]': organization?.settings?.region || organization?.region || '',
              '\\[Motivo\\]': formData.reason || '',
              '\\[Fecha\\]': previewDate,
              '\\[Tipo\\]': formData.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              '\\[Valor\\]': formData.cost.toLocaleString('es-CL'),
              '\\[Folio\\]': '000123'
            };

            let replacedContent = val;
            Object.entries(replacements).forEach(([key, replacement]) => {
              if (replacement !== undefined) {
                replacedContent = replacedContent.replace(new RegExp(key, 'gi'), replacement);
              }
            });

            return { ...el, data: { ...el.data, content: replacedContent } };
          }
          
          if (el.type === 'image') {
            let src = el.data.src;
            if (el.data.isAttribute) {
              const attrKey = el.data.attributeKey?.trim().toUpperCase();
              if (attrKey === 'LOGO INSTITUCIÓN' || attrKey === 'LOGO') {
                src = organization?.logo_url ? `/api/proxy-image?url=${encodeURIComponent(organization.logo_url)}` : 'https://placehold.co/300x300/e2e8f0/64748b?text=Logo+Organizacion';
              }
            }
            // Fallback for placeholder images or empty frames (base64 < 500 chars)
            if (!src || src.includes('placeholder') || src.includes('municipalidad-logo') || src === 'https://via.placeholder.com/150' || (src.startsWith('data:image') && src.length < 500)) {
              src = organization?.logo_url ? `/api/proxy-image?url=${encodeURIComponent(organization.logo_url)}` : 'https://placehold.co/300x300/e2e8f0/64748b?text=Logo+Organizacion';
            }
            return { ...el, data: { ...el.data, src } };
          }
          
          if (el.type === 'qr') {
            return { ...el, data: { ...el.data, content: 'PREVIEW-QR' } };
          }
          
          return el;
        }),
      };
    } catch (err) {
      console.error("Error populating design:", err);
      return selectedDesign;
    }
  };

  const recipientName = formData.type === 'residente' 
    ? formData.resident_data.full_name 
    : selectedBeneficiary?.full_name || '';
  const recipientRut = formData.type === 'residente' 
    ? formData.resident_data.rut 
    : selectedBeneficiary?.rut || '';

  const populatedDesign = getPopulatedDesign();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/certificates" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Emitir Nuevo Certificado</h1>
          <p className="text-sm text-slate-400">Configura los datos y selecciona el modelo de diseño.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Type */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-400" />
              Tipo de Certificado
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { setFormData({ ...formData, type: 'socio_activo' }); setSelectedBeneficiary(null); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.type !== 'residente' ? 'border-brand-500 bg-brand-500/5' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${formData.type !== 'residente' ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-500'}`}><Building className="w-5 h-5" /></div>
                  {formData.type !== 'residente' && <CheckCircle2 className="w-5 h-5 text-brand-400" />}
                </div>
                <p className="font-bold text-white">Socio (Activo/Inactivo)</p>
              </button>
              <button
                onClick={() => { setFormData({ ...formData, type: 'residente' }); setSelectedBeneficiary(null); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.type === 'residente' ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${formData.type === 'residente' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}><UserPlus className="w-5 h-5" /></div>
                  {formData.type === 'residente' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                </div>
                <p className="font-bold text-white">Residente Externo</p>
              </button>
            </div>
          </div>

          {/* Step 2: Search or Resident Data */}
          {formData.type !== 'residente' ? (
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Search className="w-5 h-5 text-brand-400" />Buscar Socio</h2>
              <div className="relative">
                {searching ? <div className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 border-2 border-brand-500 border-t-transparent animate-spin rounded-full" /> : <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />}
                <input type="text" placeholder="Escribe nombre o RUT..." value={search} onChange={(e) => handleSearch(e.target.value)} className="glass-input w-full pl-10 pr-4 py-2.5" />
              </div>
              {searchResults.length > 0 && !selectedBeneficiary && (
                <div className="border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                  {searchResults.map((b: any) => (
                    <button key={b.id} onClick={() => setSelectedBeneficiary(b)} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left">
                      <div><p className="text-white font-bold">{b.full_name}</p><p className="text-xs text-slate-400 font-mono">{b.rut}</p></div>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${b.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{b.status}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedBeneficiary && (
                <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-between">
                  <div><p className="text-white font-bold text-lg">{selectedBeneficiary.full_name}</p><p className="text-slate-400 text-sm">{selectedBeneficiary.rut}</p></div>
                  <button onClick={() => setSelectedBeneficiary(null)} className="text-slate-500 hover:text-white text-xs underline">Cambiar</button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-6 space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-400" />Datos del Residente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" value={formData.resident_data.full_name} onChange={(e) => setFormData({ ...formData, resident_data: { ...formData.resident_data, full_name: e.target.value }})} className="glass-input w-full px-4 py-2" placeholder="Nombre Completo *" />
                <input type="text" value={formData.resident_data.rut} onChange={(e) => setFormData({ ...formData, resident_data: { ...formData.resident_data, rut: e.target.value }})} className="glass-input w-full px-4 py-2" placeholder="RUT" />
                <input type="email" required value={formData.resident_data.email} onChange={(e) => setFormData({ ...formData, resident_data: { ...formData.resident_data, email: e.target.value }})} className="glass-input w-full px-4 py-2" placeholder="Correo Electrónico *" />
                <input type="text" value={formData.resident_data.address} onChange={(e) => setFormData({ ...formData, resident_data: { ...formData.resident_data, address: e.target.value }})} className="glass-input w-full px-4 py-2" placeholder="Dirección (Calle / Pasaje)" />
                <input type="text" value={formData.resident_data.address_number || ''} onChange={(e) => setFormData({ ...formData, resident_data: { ...formData.resident_data, address_number: e.target.value }})} className="glass-input w-full px-4 py-2 font-mono" placeholder="Nro. Dirección" />
                <input type="text" value={formData.resident_data.villa} onChange={(e) => setFormData({ ...formData, resident_data: { ...formData.resident_data, villa: e.target.value }})} className="glass-input w-full px-4 py-2 md:col-span-2" placeholder="Villa o Parque" />
              </div>
            </div>
          )}

          {/* Step 3: Reason */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-brand-400" />Motivo</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableReasons.map((r: any) => (
                <button key={r} onClick={() => setFormData({ ...formData, reason: r })} className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${formData.reason === r ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'}`}>{r}</button>
              ))}
            </div>
          </div>

          {/* Step 4: Select Design */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-brand-400" />Modelo de Certificado</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {designs.map((d: any) => (
                <button key={d.id} onClick={() => setSelectedDesignId(d.id)} className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${selectedDesignId === d.id ? 'border-brand-500 bg-brand-500/5' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className={`p-1.5 rounded-lg ${selectedDesignId === d.id ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-500'}`}><FileText className="w-4 h-4" /></div>
                    {selectedDesignId === d.id && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                  </div>
                  <p className="text-xs font-bold text-white break-words leading-tight mt-1">{d.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-6">Resumen</h2>
            
            <div className="aspect-[1/1.4] w-full bg-white/5 border border-white/10 border-dashed rounded-lg mb-6 flex flex-col items-center justify-center p-6 text-center">
              <FileText className="w-12 h-12 text-slate-500 mb-3" />
              <p className="text-sm font-medium text-slate-300">Haz clic en Revisar y Emitir</p>
              <p className="text-xs text-slate-500 mt-1">Podrás visualizar el certificado final antes de confirmar la emisión.</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Modelo:</span><span className="text-brand-400 font-bold text-right max-w-[180px] break-words leading-tight">{designs.find((d: any) => d.id === selectedDesignId)?.name || 'No elegido'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Tipo:</span><span className="text-white font-bold capitalize">{formData.type.replace('_', ' ')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Costo:</span><span className="text-emerald-400 font-black">${formData.cost.toLocaleString('es-CL')}</span></div>
            </div>
            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4" />
                {formError}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-3 flex items-center justify-center gap-2 font-bold text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-xl transition-all disabled:opacity-50"
              >
                <Eye className="w-5 h-5" />
                Visualizar Previa
              </button>
              
              <button
                onClick={handleDirectIssue}
                disabled={loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-5 h-5" />Generar Certificado</>}
              </button>
            </div>
          </div>
        </div>
    </div>

    {/* Full Screen Confirmation & Preview Modal */}
    {showConfirm && populatedDesign && (
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Verificación de Certificado"
        size="xl"
      >
        <div className="flex flex-col-reverse lg:flex-row gap-8 items-start">
          {/* Left Side: Preview */}
          <div className="flex-1 w-full space-y-4">
            <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider">Vista Previa</h3>
            <div className="p-4 bg-surface-950/60 rounded-3xl border border-white/5 shadow-inner">
              <div className="relative overflow-auto flex justify-center bg-[#050810] rounded-2xl shadow-2xl border border-brand-500/30 p-2 md:p-8 min-h-[350px]">
                <div className="scale-[0.5] md:scale-[0.65] origin-top mb-[-30%] md:mb-[-15%]">
                  <CanvasPreview 
                    design={populatedDesign as any} 
                    selectedElementId={null}
                    readOnly={true}
                    organization={organization}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center italic">
              Esta es una representación exacta del certificado que se enviará.
            </p>
            <p className="text-[10px] text-slate-600 text-center italic mt-1">
              El folio es solo referencial, se asigna definitivamente al momento de la emisión.
            </p>
          </div>

          {/* Right Side: Data Summary */}
          <div className="w-full lg:w-80 space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10 shrink-0 lg:sticky lg:top-0">
            <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider">Datos de Emisión</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase">Destinatario</label>
                <p className="text-white font-medium">{recipientName}</p>
              </div>
              {recipientRut && (
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase">RUT</label>
                  <p className="text-white font-medium">{recipientRut}</p>
                </div>
              )}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase">Tipo</label>
                <p className="text-white font-medium capitalize">{formData.type.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase">Motivo</label>
                <p className="text-white font-medium">{formData.reason}</p>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase">Modelo</label>
                <p className="text-brand-400 font-medium">{designs.find((d: any) => d.id === selectedDesignId)?.name}</p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] text-slate-500 uppercase m-0">Cobro Final</label>
                  <span className="text-emerald-400 font-black text-lg">${formData.cost.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <button
                onClick={handleIssue}
                disabled={loading}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-5 h-5" />Confirmar y Emitir</>}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-2 text-sm text-slate-500 hover:text-white transition-colors"
              >
                Volver y Corregir
              </button>
            </div>
          </div>
        </div>
      </Modal>
    )}
  </div>
  );
}
