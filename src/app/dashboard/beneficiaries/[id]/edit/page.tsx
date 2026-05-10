'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { validateRut, formatRut, getStatusColor } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  User,
  Upload,
  Camera,
  AlertCircle,
  Hash,
  Fingerprint,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle2,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditBeneficiaryPage() {
  const { organization } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [rutError, setRutError] = useState('');

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    rut: '',
    email: '',
    phone: '',
    address: '',
    comuna: '',
    id_socio: '',
    date_of_birth: '',
    status: 'active' as 'active' | 'inactive' | 'blocked',
    notes: '',
    custom_field_1_name: '',
    custom_field_1_value: '',
    custom_field_2_name: '',
    custom_field_2_value: '',
  });

  useEffect(() => {
    async function loadData() {
      if (!organization || !id) return;
      try {
        const { data, error } = await supabase
          .from('beneficiaries')
          .select('*')
          .eq('org_id', organization.id)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          const customFields = data.custom_fields || {};
          const idSocio = customFields['ID Socio'] || '';
          const address = data.address || customFields['Dirección'] || '';
          
          const remainingCustomFields = { ...customFields };
          delete remainingCustomFields['ID Socio'];
          delete remainingCustomFields['Dirección'];
          delete remainingCustomFields['Foto'];
          
          const keys = Object.keys(remainingCustomFields);
          
          setForm({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            full_name: data.full_name || '',
            rut: data.rut ? formatRut(data.rut) : '',
            email: data.email || '',
            phone: data.phone || '',
            address: address,
            comuna: data.comuna || '',
            id_socio: idSocio,
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : '',
            status: data.status,
            notes: data.notes || '',
            custom_field_1_name: keys[0] || '',
            custom_field_1_value: remainingCustomFields[keys[0]] || '',
            custom_field_2_name: keys[1] || '',
            custom_field_2_value: remainingCustomFields[keys[1]] || '',
          });
          
          if (data.photo_url) {
             setPhotoPreview(data.photo_url);
          }
        }
      } catch (err) {
        console.error('Error loading beneficiary', err);
        setError('No se pudo cargar la información del beneficiario');
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [organization, id, supabase]);

  const handleRutChange = (value: string) => {
    const formatted = formatRut(value);
    setForm((prev) => ({ ...prev, rut: formatted }));

    if (value.replace(/[^0-9kK]/g, '').length >= 8) {
      if (!validateRut(value)) {
        setRutError('RUT inválido');
      } else {
        setRutError('');
      }
    } else {
      setRutError('');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    if ((!form.first_name.trim() && !form.last_name.trim()) || !form.rut.trim()) {
      setError('Nombres, Apellidos y RUT son requeridos');
      return;
    }

    const cleanRut = form.rut.replace(/[^0-9kK]/g, '');
    if (!validateRut(cleanRut)) {
      setError('El RUT ingresado no es válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let photoUrl = null;

      if (photoFile) {
        // Limit to 2MB to prevent hangs and database bloat
        if (photoFile.size > 2 * 1024 * 1024) {
          throw new Error('La fotografía es demasiado grande. El límite es 2MB.');
        }

        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${organization.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, photoFile);
        
        if (uploadError) {
          throw new Error('Error al subir la fotografía: ' + uploadError.message);
        }

        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      const customFields: Record<string, string> = {};
      if (form.id_socio) customFields['ID Socio'] = form.id_socio;
      if (form.address) customFields['Dirección'] = form.address;
      if (form.custom_field_1_name && form.custom_field_1_value) {
        customFields[form.custom_field_1_name] = form.custom_field_1_value;
      }
      if (form.custom_field_2_name && form.custom_field_2_value) {
        customFields[form.custom_field_2_name] = form.custom_field_2_value;
      }

      const { error: updateError } = await supabase
        .from('beneficiaries')
        .update({
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          full_name: `${form.first_name} ${form.last_name}`.trim(),
          rut: cleanRut,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          comuna: form.comuna || null,
          date_of_birth: form.date_of_birth || null,
          photo_url: photoUrl || (photoPreview?.startsWith('http') ? photoPreview : null),
          custom_fields: customFields,
          status: form.status,
          notes: form.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('org_id', organization.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/beneficiaries');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el beneficiario');
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-500/10 border-t-brand-500 animate-spin" />
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-4">
          <Link
            href="/dashboard/beneficiaries"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-400 transition-colors text-[10px] font-bold uppercase tracking-widest font-mono group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Volver al Directorio
          </Link>
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Modificar Perfil
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Registro de Socio</span>
              <div className="h-px w-12 bg-white/10" />
              <span className="font-mono text-[10px] font-bold text-brand-400 tracking-widest">#{id.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/beneficiaries')}
            className="px-6 py-3 rounded-xl border border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all font-mono"
          >
            Descartar
          </button>
          <button
            form="edit-form"
            type="submit"
            disabled={loading || success}
            className={`btn-primary px-8 py-3 rounded-xl flex items-center gap-3 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all ${
              success ? '!bg-emerald-500 !shadow-emerald-500/20' : ''
            }`}
          >
            {success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold uppercase text-[10px] tracking-widest font-mono">Guardado</span>
              </>
            ) : (
              <>
                <Save className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-bold uppercase text-[10px] tracking-widest font-mono">
                  {loading ? 'Procesando...' : 'Guardar Cambios'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-slide-in-right">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form id="edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Essential Identity */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Identity Zone - Blueprint Style */}
          <div className="glass-card-solid p-8 relative overflow-hidden group border-brand-500/10">
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-brand-500/20 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-brand-500/20 pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-8">
              <Fingerprint className="w-5 h-5 text-brand-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] font-mono">Identidad Primaria</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                  <User className="w-3 h-3" /> Nombres <span className="text-brand-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Ej: Juan Andrés"
                  className="glass-input w-full px-4 py-3.5 text-base font-medium focus:ring-2 focus:ring-brand-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Apellidos <span className="text-brand-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Ej: Pérez González"
                  className="glass-input w-full px-4 py-3.5 text-base font-medium focus:ring-2 focus:ring-brand-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                  <Hash className="w-3 h-3" /> RUT Tributario <span className="text-brand-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.rut}
                    onChange={(e) => handleRutChange(e.target.value)}
                    placeholder="12.345.678-9"
                    className={`glass-input w-full px-4 py-3.5 font-mono text-brand-400 font-bold tracking-wider ${
                      rutError ? '!border-red-500/50 !bg-red-500/5' : ''
                    }`}
                    required
                  />
                  {rutError && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                   Nº Socio <span className="text-brand-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.id_socio}
                  onChange={(e) => setForm((prev) => ({ ...prev, id_socio: e.target.value }))}
                  placeholder="ID numérico"
                  className="glass-input w-full px-4 py-3.5 font-mono text-white font-bold tracking-widest bg-brand-500/[0.03]"
                />
              </div>
            </div>
          </div>

          {/* Contact & Location Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card-solid p-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <h2 className="text-[11px] font-black text-white uppercase tracking-widest font-mono">Contacto</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Email</label>
                   <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    className="glass-input w-full px-4 py-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Teléfono / Celular</label>
                   <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+56 9 1234 5678"
                    className="glass-input w-full px-4 py-3 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="glass-card-solid p-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <h2 className="text-[11px] font-black text-white uppercase tracking-widest font-mono">Residencia</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Dirección Completa</label>
                   <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Nombre Calle, Nº Casa/Depto"
                    className="glass-input w-full px-4 py-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Comuna</label>
                   <input
                    type="text"
                    value={form.comuna}
                    onChange={(e) => setForm((prev) => ({ ...prev, comuna: e.target.value }))}
                    placeholder="Puente Alto, etc."
                    className="glass-input w-full px-4 py-3 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Metadata & History */}
          <div className="glass-card-solid p-6">
             <div className="flex items-center gap-3 mb-6">
                <FileText className="w-4 h-4 text-slate-400" />
                <h2 className="text-[11px] font-black text-white uppercase tracking-widest font-mono">Atributos del Socio & Notas</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
                       <span>Campo Pers. 1</span>
                       <input 
                        type="text" 
                        value={form.custom_field_1_name} 
                        onChange={(e) => setForm(p => ({...p, custom_field_1_name: e.target.value}))}
                        placeholder="Nombre etiqueta"
                        className="bg-transparent border-none text-[9px] text-brand-400 focus:ring-0 p-0 text-right uppercase tracking-tighter"
                       />
                    </label>
                    <input
                      type="text"
                      value={form.custom_field_1_value}
                      onChange={(e) => setForm((prev) => ({ ...prev, custom_field_1_value: e.target.value }))}
                      className="glass-input w-full px-4 py-3 text-sm"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
                       <span>Campo Pers. 2</span>
                       <input 
                        type="text" 
                        value={form.custom_field_2_name} 
                        onChange={(e) => setForm(p => ({...p, custom_field_2_name: e.target.value}))}
                        placeholder="Nombre etiqueta"
                        className="bg-transparent border-none text-[9px] text-brand-400 focus:ring-0 p-0 text-right uppercase tracking-tighter"
                       />
                    </label>
                    <input
                      type="text"
                      value={form.custom_field_2_value}
                      onChange={(e) => setForm((prev) => ({ ...prev, custom_field_2_value: e.target.value }))}
                      className="glass-input w-full px-4 py-3 text-sm"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Bitácora / Observaciones Internas</label>
                 <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="glass-input w-full px-4 py-3 text-sm resize-none"
                  placeholder="Notas administrativas sobre el socio..."
                />
              </div>
          </div>
        </div>

        {/* Right Column: Visuals & Status */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Photo Card */}
          <div className="glass-card-solid p-8 flex flex-col items-center text-center group border-white/5 relative">
            <div className="absolute top-4 right-4">
               <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full bg-surface-900/50 border border-white/10 text-slate-400 hover:text-brand-400 hover:border-brand-400/30 transition-all shadow-xl"
               >
                 <Camera className="w-4 h-4" />
               </button>
            </div>

            <div className="relative mb-6">
              <div className="w-48 h-48 rounded-[2rem] overflow-hidden bg-surface-950 border-4 border-brand-500/10 group-hover:border-brand-500/30 transition-all shadow-2xl rotate-3 group-hover:rotate-0 transform duration-500">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Socio"
                    width={192}
                    height={192}
                    className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-brand-500/[0.03]">
                    <User className="w-16 h-16 text-brand-400 opacity-20" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-brand-500 p-2.5 rounded-2xl shadow-xl text-white">
                 <Upload className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-1">Fotografía de Registro</h3>
            <p className="text-slate-500 text-[10px] uppercase font-mono tracking-tighter">Bio-ID System v2.1</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Status & Lifecycle */}
          <div className="glass-card-solid p-6 space-y-6 border-white/5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              <h2 className="text-[11px] font-black text-white uppercase tracking-widest font-mono">Estado del Ciclo de Vida</h2>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Estatus Operativo</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['active', 'inactive', 'blocked'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(p => ({...p, status: s as any}))}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          form.status === s 
                          ? getStatusColor(s).replace('/10', '/20') + ' border-current shadow-lg scale-[1.02]' 
                          : 'border-white/5 text-slate-500 hover:bg-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest font-mono">
                          {s === 'active' ? 'Activo' : s === 'inactive' ? 'Inactivo' : 'Bloqueado'}
                        </span>
                        {form.status === s && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Fecha de Nacimiento</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => setForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                      className="glass-input w-full pl-11 pr-4 py-3 text-sm font-mono text-slate-300"
                    />
                  </div>
               </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="p-6 rounded-3xl bg-brand-500/5 border border-brand-500/10 space-y-3">
             <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-widest font-mono">Consejo Pro</h4>
             <p className="text-[11px] text-slate-400 leading-relaxed">
               Asegúrate de que la foto sea frontal y con fondo claro para una mejor legibilidad en la credencial física y digital.
             </p>
          </div>
        </div>

      </form>
    </div>
  );
}
