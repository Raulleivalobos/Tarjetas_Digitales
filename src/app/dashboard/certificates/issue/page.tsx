'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
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
  X
} from 'lucide-react';
import Link from 'next/link';
import { Beneficiary, CertificateType } from '@/lib/types';
import { sendCertificateNotification } from '@/app/actions/email';

const REASONS = [
  'Certificación de Domicilio',
  'Trámite General',
  'Motivos Laborales',
  'Educación',
  'Subsidios'
];

export default function IssueCertificatePage() {
  const router = useRouter();
  const { organization } = useAuth();
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

      // Filter specifically for certificates
      const certificateDesigns = results.filter((d: any) => 
        d.design_type === 'certificate' || 
        d.name.toLowerCase().includes('certificado') || 
        d.name.toLowerCase().includes('residencia')
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
        selectBeneficiary(exactMatch);
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
      setFormError('Debes seleccionar un diseño antes de emitir.');
      return;
    }
    if (formData.type === 'residente' && (!formData.resident_data.full_name || !formData.resident_data.email)) {
      setFormError('Debes ingresar el nombre y el correo del residente.');
      return;
    }
    if (formData.type !== 'residente' && (!selectedBeneficiary || !selectedBeneficiary.email)) {
      setFormError('El socio seleccionado no tiene correo electrónico registrado. Actualiza sus datos en la sección Beneficiarios primero.');
      return;
    }
    setShowConfirm(true);
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
          org_info: { name: organization.name, rut: organization.rut }
        }
      };

      const { data: newCert, error: insertError } = await supabase.from('certificates').insert(certData).select('id').single();
      if (insertError) throw insertError;

      // Intentar enviar notificación por email si hay un destinatario
      const email = formData.type === 'residente' ? formData.resident_data.email : selectedBeneficiary?.email;
      if (email) {
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

      router.push('/dashboard/certificates');
    } catch (err) {
      console.error('Error issuing certificate:', err);
      alert('Error al emitir. Verifica que la tabla tenga la columna design_id.');
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
          if (el.type === 'text' && el.data.isAttribute) {
            const attrKey = el.data.attributeKey?.trim().toUpperCase();
            if (!attrKey) return el;
            
            let val = el.data.content || '';
            if (attrKey === 'NOMBRE RECEPTOR' || attrKey === 'NOMBRE') val = recipientName || val;
            else if (attrKey === 'NOMBRE INSTITUCIÓN' || attrKey === 'ORGANIZACION') val = organization?.name || val;
            else if (attrKey === 'RUT') val = recipientRut || val;
            else if (attrKey === 'FECHA') val = previewDate;
            else if (attrKey === 'MOTIVO') val = formData.reason || val;
            else if (attrKey === 'COMUNA') val = organization?.settings?.commune || val;
            
            return { ...el, data: { ...el.data, content: val } };
          }
          if (el.type === 'image' && el.data.isAttribute) {
            const attrKey = el.data.attributeKey?.trim().toUpperCase();
            let src = el.data.src;
            if (attrKey === 'LOGO INSTITUCIÓN' || attrKey === 'LOGO') {
              src = organization?.logo_url || src;
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
                    <button key={b.id} onClick={() => selectBeneficiary(b)} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left">
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
                <input type="text" value={formData.resident_data.address} onChange={(e) => setFormData({ ...formData, resident_data: { ...formData.resident_data, address: e.target.value }})} className="glass-input w-full px-4 py-2" placeholder="Dirección" />
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
            <h2 className="text-lg font-semibold text-white mb-6">Vista Previa</h2>
            
            {/* Live Preview Canvas */}
            <div className="aspect-[1/1.4] w-full bg-white rounded-lg mb-6 overflow-hidden relative shadow-2xl border border-white/10 group cursor-zoom-in" onClick={() => setPreviewModalOpen(true)}>
              {populatedDesign ? (
                <div className="scale-[0.28] origin-top-left w-[1000%] h-[1000%]">
                   <CanvasPreview 
                    design={populatedDesign as any} 
                    elements={populatedDesign.elements} 
                    onElementSelect={() => {}}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                  Selecciona un modelo
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
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
            <button
              onClick={handleConfirm}
              disabled={loading || (formData.type === 'residente' ? !formData.resident_data.full_name : !selectedBeneficiary) || !selectedDesignId}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Eye className="w-5 h-5" />Revisar y Emitir</>}
            </button>
          </div>
        </div>
    </div>

    {/* Confirmation Preview Modal */}
    {showConfirm && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="glass-card-solid w-full max-w-lg mx-4 p-6 space-y-5 border border-brand-500/20 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
              Confirmar Emisión
            </h2>
            <button onClick={() => setShowConfirm(false)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 bg-surface-950/60 rounded-xl p-4 border border-white/5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Destinatario:</span>
              <span className="text-white font-bold">{recipientName}</span>
            </div>
            {recipientRut && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">RUT:</span>
                <span className="text-white font-mono">{recipientRut}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tipo:</span>
              <span className="text-white font-bold capitalize">{formData.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Motivo:</span>
              <span className="text-white">{formData.reason}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Modelo:</span>
              <span className="text-brand-400 font-bold">{designs.find((d: any) => d.id === selectedDesignId)?.name}</span>
            </div>
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex justify-between text-base">
                <span className="text-slate-400 font-bold">Cobro:</span>
                <span className="text-emerald-400 font-black text-lg">${formData.cost.toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200 leading-relaxed">
              Al confirmar, se generará el certificado con folio correlativo y se enviará por correo. Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-3 text-sm font-bold text-slate-300 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleIssue}
              disabled={loading}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 font-bold text-sm"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" />Confirmar y Emitir</>}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Full Screen Preview Modal */}
    {previewModalOpen && populatedDesign && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4 md:p-8">
        <div className="relative w-full max-w-5xl h-full flex flex-col">
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setPreviewModalOpen(false)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-xl border border-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-2xl overflow-auto p-4 md:p-12 flex justify-center items-start">
            <div className="scale-[0.5] md:scale-[0.85] origin-top">
              <CanvasPreview 
                design={populatedDesign as any} 
                elements={populatedDesign.elements} 
                onElementSelect={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
