'use client';

import { useState, useEffect, useRef} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Save, Building2, Palette, Shield, Users, Mail, UserPlus, UserX, AlertCircle, CheckCircle2, Upload, Trash2, FileText, DollarSign, Plus, Key } from 'lucide-react';
import { CHILE_DATA } from '@/lib/chile-data';

import { inviteUserToOrg } from '@/app/actions/invite';

type Tab = 'general' | 'members' | 'certificates' | 'security';
type Role = 'owner' | 'admin' | 'validator' | 'viewer' | 'auditor' | 'municipal_admin' | 'municipal_viewer';

interface Member {
  id: string;
  user_id: string;
  role: Role;
  email?: string;
  created_at: string;
}

const roleDescriptions: Record<Role, { title: string; desc: string }> = {
  owner: { title: 'Propietario', desc: 'Control total de la organización y facturación.' },
  admin: { title: 'Administrador', desc: 'Puede gestionar beneficiarios, beneficios y tarjetas.' },
  validator: { title: 'Validador', desc: 'Solo puede escanear y validar tarjetas/beneficios.' },
  viewer: { title: 'Visualizador', desc: 'Acceso de solo lectura a métricas e información.' },
  auditor: { title: 'Auditor', desc: 'Acceso de revisión a todos los registros y métricas.' },
  municipal_admin: { title: 'Admin Municipal', desc: 'Acceso administrativo para gestión de convenios municipales.' },
  municipal_viewer: { title: 'Observador Municipal', desc: 'Acceso estadístico para entes gubernamentales.' },
};

export default function SettingsPage() {
  const { organization, refreshOrganization, user: currentUser, membership } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  
  const isReadOnly = !['owner', 'admin'].includes(membership?.role || '');
  
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    primary_color: organization?.primary_color || '#6366f1',
    secondary_color: organization?.secondary_color || '#8b5cf6',
    logo_url: organization?.logo_url || '',
    access_code: organization?.access_code || '',
    rut: (organization?.settings as any)?.rut || '',
    address: (organization?.settings as any)?.address || '',
    villa: (organization?.settings as any)?.villa || '',
    commune: (organization?.settings as any)?.commune || '',
    province: (organization?.settings as any)?.province || '',
    region: (organization?.settings as any)?.region || '',
    org_type: organization?.org_type || 'jjvv',
    parent_org_id: organization?.parent_org_id || '',
    certificate_prices: (organization?.settings as any)?.certificate_prices || {
      active: 500,
      inactive: 1000,
      resident: 2000,
    },
    signatures: (organization?.settings as any)?.signatures || {
      president: { name: '', title: 'Presidente(a) Junta de Vecinos', enabled: true },
      secretary: { name: '', title: 'Secretario(a) Junta de Vecinos', enabled: true },
    },
    reasons: (organization?.settings as any)?.reasons || [
      'Certificación de Domicilio',
      'Trámite General',
      'Motivos Laborales',
      'Educación',
      'Subsidios'
    ],
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('validator');

  useEffect(() => {
    if (activeTab === 'members' && organization) {
      fetchMembers();
    }
    if (activeTab === 'general') {
      fetchMunicipalities();
    }
  }, [activeTab, organization]);

  const fetchMunicipalities = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('org_type', 'municipality');
    if (data) setMunicipalities(data);
  };

  const fetchMembers = async () => {
    if (!organization) return;
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', organization.id);
    
    if (!error && data) {
      const enrichedMembers = data.map((m: any) => ({
        ...m,
        email: m.user_id === currentUser?.id ? currentUser?.email : `usuario-${m.user_id.substring(0,4)}@ejemplo.com`
      }));
      setMembers(enrichedMembers);
    }
    setLoadingMembers(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${organization.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', organization.id);
        
      if (updateError) throw updateError;
        
      await refreshOrganization();
      setMessage({ text: 'Logo subido correctamente. Haz clic en Guardar Cambios para finalizar.', type: 'success' });
    } catch (err) {
      console.error('Error uploading logo:', err);
      setMessage({ text: 'Error al subir el logo', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>, role: 'president' | 'secretary') => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${organization.id}/signature-${role}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ 
        ...prev, 
        signatures: { 
          ...prev.signatures, 
          [role]: { ...prev.signatures[role], signature_url: publicUrl } 
        } 
      }));
      
      setMessage({ text: 'Firma subida correctamente. Haz clic en Guardar Configuración para finalizar.', type: 'success' });
    } catch (err) {
      console.error('Error uploading signature:', err);
      setMessage({ text: 'Error al subir la firma', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const currentSettings = typeof organization.settings === 'string' 
        ? JSON.parse(organization.settings) 
        : (organization.settings || {});

      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          description: formData.description,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          logo_url: formData.logo_url,
          org_type: formData.org_type,
          access_code: formData.access_code.trim().toUpperCase(),
          parent_org_id: formData.parent_org_id || null,
          settings: {
            ...currentSettings,
            rut: formData.rut,
            address: formData.address,
            villa: formData.villa,
            commune: formData.commune,
            province: formData.province,
            region: formData.region,
            certificate_prices: formData.certificate_prices,
            signatures: formData.signatures,
            reasons: formData.reasons,
          }
        })
        .eq('id', organization.id);

      if (error) throw error;
      
      await refreshOrganization();
      setMessage({ text: 'Configuración guardada exitosamente', type: 'success' });
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ text: 'Error al guardar configuración', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const result = await inviteUserToOrg({
        email: inviteEmail,
        role: inviteRole,
        orgId: organization.id,
        orgName: organization.name,
        accessCode: formData.access_code
      });

      if (result.success) {
        setMessage({ text: `Invitación enviada a ${inviteEmail}. El usuario recibirá un correo para unirse.`, type: 'success' });
        setInviteEmail('');
      } else {
        setMessage({ text: `Error al invitar: ${result.error}`, type: 'error' });
      }
    } catch (err) {
      console.error('Invite error:', err);
      setMessage({ text: 'Error de conexión al enviar invitación', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!organization) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Configuración de Organización</h1>
        <p className="text-slate-400 mt-1 text-sm">Administra los detalles, roles y seguridad de tu cuenta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-4 md:col-span-1">
          <div className="glass-card p-2 space-y-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'general' ? 'bg-brand-500/15 text-brand-300 border-l-2 border-brand-500' : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-300'
              }`}
            >
              <Building2 className="w-4 h-4" /> Perfil y Diseño
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'members' ? 'bg-brand-500/15 text-brand-300 border-l-2 border-brand-500' : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" /> Usuarios y Roles
            </button>
            <button 
              onClick={() => setActiveTab('certificates')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'certificates' ? 'bg-brand-500/15 text-brand-300 border-l-2 border-brand-500' : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" /> Certificados
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                activeTab === 'security' ? 'bg-brand-500/15 text-brand-300 border-l-2 border-brand-500' : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-300'
              }`}
            >
              <Shield className="w-4 h-4" /> Seguridad
            </button>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl text-sm flex items-center gap-3 animate-slide-in-right ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          {activeTab === 'general' && (
            <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-8 animate-fade-in">
              <section className="space-y-6">
                <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 mb-8">
                  <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Configuración de Nivel Institucional
                  </h2>
                  <p className="text-sm text-slate-400 mb-6">Define si eres una Junta de Vecinos o una Municipalidad para activar funciones avanzadas.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">Tipo de Organización</label>
                      <select
                        value={formData.org_type}
                        onChange={(e) => setFormData({ ...formData, org_type: e.target.value as any })}
                        className="glass-input w-full px-4 py-3 text-sm appearance-none cursor-pointer border-brand-500/30"
                      >
                        <option value="jjvv">Junta de Vecinos (JJVV)</option>
                        <option value="municipality">Municipalidad (Entidad Superior)</option>
                        <option value="corporation">Corporación / Privado</option>
                      </select>
                    </div>

                    {formData.org_type === 'jjvv' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 ml-1">Vincular con Municipalidad</label>
                        <select
                          value={formData.parent_org_id}
                          onChange={(e) => setFormData({ ...formData, parent_org_id: e.target.value })}
                          className="glass-input w-full px-4 py-3 text-sm appearance-none cursor-pointer border-indigo-500/30"
                        >
                          <option value="">Independiente (Sin vínculo)</option>
                          {municipalities.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Nombre de la Institución</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="glass-input w-full px-4 py-3 text-sm"
                      placeholder="Ej. Junta de Vecinos Parque San Carlos"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Identificador URL (Slug)</label>
                    <div className="flex bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
                      <span className="inline-flex items-center px-3 text-slate-500 bg-white/5 border-r border-white/10 text-xs sm:text-sm font-mono">
                        app.skardkey.cl/
                      </span>
                      <input
                        type="text"
                        value={organization?.slug || ''}
                        disabled
                        className="w-full px-4 py-2.5 text-sm bg-transparent text-slate-400 cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Región</label>
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value, province: '', commune: '' })}
                      className="glass-input w-full px-4 py-3 text-sm appearance-none cursor-pointer"
                    >
                      <option value="">Seleccionar Región</option>
                      {CHILE_DATA.map((r: any) => (
                        <option key={r.name} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Provincia</label>
                    <select
                      value={formData.province}
                      disabled={!formData.region}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value, commune: '' })}
                      className="glass-input w-full px-4 py-3 text-sm appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Seleccionar Provincia</option>
                      {CHILE_DATA.find((r: any) => r.name === formData.region)?.provinces.map((p: any) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Comuna</label>
                    <select
                      value={formData.commune}
                      disabled={!formData.province}
                      onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                      className="glass-input w-full px-4 py-3 text-sm appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Seleccionar Comuna</option>
                      {CHILE_DATA.find(r => r.name === formData.region)
                        ?.provinces.find(p => p.name === formData.province)
                        ?.communes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Dirección (Calle y Número)</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="glass-input w-full px-4 py-3 text-sm"
                      placeholder="Ej: Av. Principal 123"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Villa o Población</label>
                    <input
                      type="text"
                      value={formData.villa}
                      onChange={(e) => setFormData({ ...formData, villa: e.target.value })}
                      className="glass-input w-full px-4 py-3 text-sm"
                      placeholder="Ej: Villa San Carlos"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">RUT de la Institución</label>
                    <input
                      type="text"
                      value={formData.rut}
                      onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                      className="glass-input w-full px-4 py-3 text-sm"
                      placeholder="70.123.456-7"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Descripción</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="glass-input w-full px-4 py-2 text-sm h-11 resize-none"
                      placeholder="Descripción breve..."
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-brand-500/10">
                  <h2 className="text-lg font-semibold text-white mb-1">Identidad Visual</h2>
                  <p className="text-sm text-slate-400 mb-6">Logo y colores que se aplicarán en tu plataforma y credenciales.</p>

                  <div className="mb-8 p-6 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-32 h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative group">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} className="w-full h-full object-contain" alt="Logo" />
                      ) : (
                        <Building2 className="w-12 h-12 text-slate-700" />
                      )}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cambiar Logo</span>
                      </label>
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent animate-spin rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2 text-center md:text-left">
                      <p className="text-xs text-slate-300 font-medium">Dimensiones recomendadas: 512x512px</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Formatos: PNG, JPG o SVG (Max 2MB)</p>
                    </div>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="pt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-[0_8px_20px_rgba(99,102,241,0.3)] flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                )}
              </section>
            </form>
          )}

          {activeTab === 'certificates' && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Configuración de Certificados</h2>
                  <p className="text-sm text-slate-400 mb-6">Define los valores de emisión y las firmas autorizadas.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Socio Activo</h3>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <input
                          type="number"
                          value={formData.certificate_prices.active}
                          onChange={(e) => setFormData({ ...formData, certificate_prices: { ...formData.certificate_prices, active: parseInt(e.target.value) }})}
                          className="glass-input w-full px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Socio Inactivo</h3>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <input
                          type="number"
                          value={formData.certificate_prices.inactive}
                          onChange={(e) => setFormData({ ...formData, certificate_prices: { ...formData.certificate_prices, inactive: parseInt(e.target.value) }})}
                          className="glass-input w-full px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Residente</h3>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <input
                          type="number"
                          value={formData.certificate_prices.resident}
                          onChange={(e) => setFormData({ ...formData, certificate_prices: { ...formData.certificate_prices, resident: parseInt(e.target.value) }})}
                          className="glass-input w-full px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h2 className="text-lg font-semibold text-white mb-1">Firmas Autorizadas</h2>
                  <p className="text-sm text-slate-400 mb-6">Estas firmas aparecerán automáticamente al pie de los certificados.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Presidente */}
                    <div className="space-y-4 p-5 rounded-2xl bg-slate-900/40 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Presidente(a)</label>
                        <input 
                          type="checkbox" 
                          checked={formData.signatures.president.enabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, president: { ...prev.signatures.president, enabled: e.target.checked } }}))}
                          className="rounded border-white/10 bg-white/5"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative group">
                          {formData.signatures.president.signature_url ? (
                            <img src={formData.signatures.president.signature_url} className="w-full h-full object-contain" alt="Firma" />
                          ) : (
                            <div className="text-[10px] text-slate-600 text-center px-2">Sin firma</div>
                          )}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <input type="file" className="hidden" onChange={(e) => handleSignatureUpload(e, 'president')} accept="image/*" />
                            <span className="text-[9px] font-bold text-white uppercase tracking-tighter text-center px-1">Cambiar Firma</span>
                          </label>
                          {uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent animate-spin rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={formData.signatures.president.name}
                            onChange={(e) => setFormData({ ...formData, signatures: { ...formData.signatures, president: { ...formData.signatures.president, name: e.target.value } }})}
                            className="glass-input w-full px-3 py-2 text-sm"
                            placeholder="Nombre completo"
                          />
                          <label className="w-full py-2 px-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer border border-brand-500/20 transition-all">
                            <Upload className="w-3.5 h-3.5" />
                            Subir Firma
                            <input type="file" className="hidden" onChange={(e) => handleSignatureUpload(e, 'president')} accept="image/*" />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Secretario */}
                    <div className="space-y-4 p-5 rounded-2xl bg-slate-900/40 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Secretario(a)</label>
                        <input 
                          type="checkbox" 
                          checked={formData.signatures.secretary.enabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, secretary: { ...prev.signatures.secretary, enabled: e.target.checked } }}))}
                          className="rounded border-white/10 bg-white/5"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative group">
                          {formData.signatures.secretary.signature_url ? (
                            <img src={formData.signatures.secretary.signature_url} className="w-full h-full object-contain" alt="Firma" />
                          ) : (
                            <div className="text-[10px] text-slate-600 text-center px-2">Sin firma</div>
                          )}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <input type="file" className="hidden" onChange={(e) => handleSignatureUpload(e, 'secretary')} accept="image/*" />
                            <span className="text-[9px] font-bold text-white uppercase tracking-tighter text-center px-1">Cambiar Firma</span>
                          </label>
                          {uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent animate-spin rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={formData.signatures.secretary.name}
                            onChange={(e) => setFormData({ ...formData, signatures: { ...formData.signatures, secretary: { ...formData.signatures.secretary, name: e.target.value } }})}
                            className="glass-input w-full px-3 py-2 text-sm"
                            placeholder="Nombre completo"
                          />
                          <label className="w-full py-2 px-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer border border-brand-500/20 transition-all">
                            <Upload className="w-3.5 h-3.5" />
                            Subir Firma
                            <input type="file" className="hidden" onChange={(e) => handleSignatureUpload(e, 'secretary')} accept="image/*" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Guardar Configuración
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6 animate-fade-in">
              {/* Invite Form - Only for Admins */}
              {!isReadOnly && (
                <div className="glass-card p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">Añadir Nuevo Usuario</h2>
                      <p className="text-sm text-slate-400">Envía un acceso a un colaborador para que te ayude a gestionar.</p>
                    </div>
                  </div>

                  <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="ejemplo@correo.com"
                          className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Rol de Acceso</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as Role)}
                        className="glass-input w-full px-4 py-2.5 text-sm appearance-none cursor-pointer"
                      >
                        <option value="admin">Administrador</option>
                        <option value="validator">Validador (Solo Escanear)</option>
                        <option value="auditor">Auditor (Revisión Completa)</option>
                        <option value="viewer">Visualizador (Solo Lectura)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invitar Usuario
                    </button>
                  </form>
                </div>
              )}

              {/* Members List */}
              <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <h2 className="text-lg font-bold text-white">Usuarios con Acceso</h2>
                  <p className="text-sm text-slate-400">Lista de personas que pueden gestionar esta institución.</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4">Rol Asignado</th>
                        <th className="px-6 py-4">Fecha Acceso</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {members.map((member) => (
                        <tr key={member.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold text-xs border border-brand-500/20">
                                {member.email?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="text-slate-200 font-medium block">{member.email}</span>
                                <span className="text-[9px] text-slate-600 font-mono tracking-tighter">ID: {member.user_id.substring(0,8)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                              member.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              member.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              member.role === 'validator' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              member.role === 'auditor' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              {roleDescriptions[member.role]?.title || member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                              {new Date(member.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {member.role !== 'owner' && !isReadOnly && (
                              <button className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="glass-card p-6 md:p-8 space-y-6 animate-fade-in text-center py-12">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-slate-300">Seguridad</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Las opciones de seguridad avanzada estarán disponibles próximamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
