'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Save, Building2, Palette, Shield, Users, Mail, UserPlus, UserX, AlertCircle, CheckCircle2, Upload, Trash2, FileText, DollarSign, Plus } from 'lucide-react';
import { CHILE_DATA } from '@/lib/chile-data';

type Tab = 'general' | 'members' | 'certificates' | 'security';
type Role = 'owner' | 'admin' | 'validator' | 'viewer' | 'municipal_admin' | 'municipal_viewer';

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
  municipal_admin: { title: 'Admin Municipal', desc: 'Acceso administrativo para gestión de convenios municipales.' },
  municipal_viewer: { title: 'Observador Municipal', desc: 'Acceso estadístico para entes gubernamentales.' },
};

export default function SettingsPage() {
  const { organization, refreshOrganization, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    primary_color: organization?.primary_color || '#6366f1',
    secondary_color: organization?.secondary_color || '#8b5cf6',
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
    // En una implementación real, se haría un join con auth.users mediante RPC o perfiles
    const { data, error } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', organization.id);
    
    if (!error && data) {
      // Mock emails based on user_id for demonstration purposes
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
      
      // Auto-save logo
      await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', organization.id);
        
      await refreshOrganization();
    } catch (err) {
      console.error('Error uploading logo:', err);
      setMessage({ text: 'Error al subir el logo', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    setLoading(true);
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

      if (error) {
        throw error;
      }
      
      setMessage({ text: 'Configuración guardada exitosamente', type: 'success' });
      await refreshOrganization();
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ text: 'Error al guardar configuración', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulación de envío de invitación (La API real requeriría Supabase Auth Admin o Edge Functions)
    setTimeout(() => {
      setMessage({ text: `Invitación enviada a ${inviteEmail} como ${roleDescriptions[inviteRole].title}`, type: 'success' });
      setInviteEmail('');
      setLoading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }, 1000);
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
              <div className="space-y-6">
                {/* Tipo de Organización y Jerarquía */}
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
                      <div className="space-y-2 animate-slide-in-right">
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
                      placeholder="Ej. Junta de Vecinos Los Álamos"
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

                {/* Institutional Access Key - P1 New Feature */}
                <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Key className="w-12 h-12 text-indigo-400" />
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Clave de Acceso Institucional</p>
                      <h3 className="text-2xl font-black text-white font-mono tracking-widest uppercase">
                        {organization?.access_code || 'CARGANDO...'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 max-w-sm">
                        Comparte esta clave con otros administradores para vincular esta organización de forma privada.
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(organization?.access_code || '');
                        alert('Clave copiada al portapapeles');
                      }}
                      className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400 text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      Copiar Clave
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Región</label>
                    <select
                      value={formData.region}
                      onChange={(e) => {
                        const region = e.target.value;
                        setFormData({ ...formData, region, province: '', commune: '' });
                      }}
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
                      onChange={(e) => {
                        const province = e.target.value;
                        setFormData({ ...formData, province, commune: '' });
                      }}
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
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent animate-spin rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="font-medium text-white">Logo de la Institución</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Este logo se utilizará en el menú lateral, en los certificados y en las tarjetas digitales para identificar a la institución. Se recomienda formato PNG o SVG con fondo transparente.
                      </p>
                      <div className="flex gap-3">
                        <label className="btn-ghost px-4 py-2 text-xs font-bold cursor-pointer flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          Subir nuevo logo
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                        </label>
                        {formData.logo_url && (
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                            className="px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-lg transition-all flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-slate-300">Color Principal</label>
                        <span className="text-xs font-mono text-slate-500 uppercase mt-1 block">{formData.primary_color}</span>
                      </div>
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                        <input
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="absolute inset-[-10px] w-20 h-20 cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-slate-300">Color Secundario</label>
                        <span className="text-xs font-mono text-slate-500 uppercase mt-1 block">{formData.secondary_color}</span>
                      </div>
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                        <input
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="absolute inset-[-10px] w-20 h-20 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar Cambios
                  </button>
                </div>
              </div>
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
                          onChange={async (e) => {
                            const val = e.target.checked;
                            const newSignatures = { 
                              ...formData.signatures, 
                              president: { ...formData.signatures.president, enabled: val } 
                            };
                            setFormData(prev => ({ ...prev, signatures: newSignatures }));
                            
                            const currentSettings = typeof organization.settings === 'string' 
                              ? JSON.parse(organization.settings) 
                              : (organization.settings || {});

                            await supabase.from('organizations').update({ 
                              settings: { ...currentSettings, signatures: newSignatures } 
                            }).eq('id', organization.id);
                            await refreshOrganization();
                          }}
                          className="rounded border-white/10 bg-white/5"
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative">
                          {formData.signatures.president.signature_url ? (
                            <img src={formData.signatures.president.signature_url} className="w-full h-full object-contain" alt="Firma Presidente" />
                          ) : (
                            <div className="text-[10px] text-slate-600 text-center px-2">Sin firma</div>
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
                          <label className="btn-ghost px-3 py-1.5 text-[10px] font-bold cursor-pointer flex items-center justify-center gap-2">
                            <Upload className="w-3 h-3" /> Subir Firma
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !organization) return;
                                const path = `${organization.id}/sig-pres-${Date.now()}.${file.name.split('.').pop()}`;
                                const { data } = await supabase.storage.from('logos').upload(path, file);
                                if (data) {
                                  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
                                  const newSignatures = { 
                                    ...formData.signatures, 
                                    president: { ...formData.signatures.president, signature_url: publicUrl } 
                                  };
                                  
                                  setFormData(prev => ({ ...prev, signatures: newSignatures }));
                                  
                                  // Auto-save signature
                                  const currentSettings = typeof organization.settings === 'string' 
                                    ? JSON.parse(organization.settings) 
                                    : (organization.settings || {});

                                  await supabase
                                    .from('organizations')
                                    .update({ 
                                      settings: { 
                                        ...currentSettings, 
                                        signatures: newSignatures 
                                      } 
                                    })
                                    .eq('id', organization.id);
                                  
                                  await refreshOrganization();
                                }
                              }} 
                            />
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
                          onChange={async (e) => {
                            const val = e.target.checked;
                            const newSignatures = { 
                              ...formData.signatures, 
                              secretary: { ...formData.signatures.secretary, enabled: val } 
                            };
                            setFormData(prev => ({ ...prev, signatures: newSignatures }));
                            
                            const currentSettings = typeof organization.settings === 'string' 
                              ? JSON.parse(organization.settings) 
                              : (organization.settings || {});

                            await supabase.from('organizations').update({ 
                              settings: { ...currentSettings, signatures: newSignatures } 
                            }).eq('id', organization.id);
                            await refreshOrganization();
                          }}
                          className="rounded border-white/10 bg-white/5"
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative">
                          {formData.signatures.secretary.signature_url ? (
                            <img src={formData.signatures.secretary.signature_url} className="w-full h-full object-contain" alt="Firma Secretario" />
                          ) : (
                            <div className="text-[10px] text-slate-600 text-center px-2">Sin firma</div>
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
                          <label className="btn-ghost px-3 py-1.5 text-[10px] font-bold cursor-pointer flex items-center justify-center gap-2">
                            <Upload className="w-3 h-3" /> Subir Firma
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !organization) return;
                                const path = `${organization.id}/sig-sec-${Date.now()}.${file.name.split('.').pop()}`;
                                const { data } = await supabase.storage.from('logos').upload(path, file);
                                if (data) {
                                  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
                                  const newSignatures = { 
                                    ...formData.signatures, 
                                    secretary: { ...formData.signatures.secretary, signature_url: publicUrl } 
                                  };

                                  setFormData(prev => ({ ...prev, signatures: newSignatures }));

                                  // Auto-save signature
                                  const currentSettings = typeof organization.settings === 'string' 
                                    ? JSON.parse(organization.settings) 
                                    : (organization.settings || {});

                                  await supabase
                                    .from('organizations')
                                    .update({ 
                                      settings: { 
                                        ...currentSettings, 
                                        signatures: newSignatures 
                                      } 
                                    })
                                    .eq('id', organization.id);
                                  
                                  await refreshOrganization();
                                }
                              }} 
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h2 className="text-lg font-semibold text-white mb-1">Motivos de Emisión</h2>
                  <p className="text-sm text-slate-400 mb-6">Lista de motivos disponibles para seleccionar al emitir.</p>
                  
                  <div className="space-y-3">
                    {formData.reasons.map((reason: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={reason}
                          onChange={(e) => {
                            const newReasons = [...formData.reasons];
                            newReasons[index] = e.target.value;
                            setFormData({ ...formData, reasons: newReasons });
                          }}
                          className="glass-input flex-1 px-4 py-2 text-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const newReasons = formData.reasons.filter((_: any, i: number) => i !== index);
                            setFormData({ ...formData, reasons: newReasons });
                          }}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, reasons: [...formData.reasons, 'Nuevo Motivo'] })}
                      className="btn-ghost px-4 py-2 text-xs font-bold flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Añadir Motivo
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar Configuración
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6 animate-fade-in">
              {/* Invite Section */}
              <div className="glass-card p-6 md:p-8">
                <h2 className="text-lg font-semibold text-white mb-1">Invitar Usuario</h2>
                <p className="text-sm text-slate-400 mb-6">Añade colaboradores a tu organización y asígnales permisos específicos.</p>
                
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colaborador@ejemplo.com"
                        className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-64">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Rol de Acceso</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as Role)}
                      className="glass-input w-full px-4 py-2.5 text-sm appearance-none"
                    >
                      <option value="admin">Administrador</option>
                      <option value="validator">Validador (Solo Escanear)</option>
                      <option value="viewer">Visualizador (Solo Lectura)</option>
                      <option value="municipal_admin">Admin Municipal</option>
                      <option value="municipal_viewer">Observador Municipal</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !inviteEmail}
                    className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 whitespace-nowrap disabled:opacity-50 h-[42px]"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Enviar Invitación
                  </button>
                </form>
              </div>

              {/* Members List */}
              <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/30">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Usuarios Activos</h2>
                    <p className="text-sm text-slate-400">Gestiona los accesos de tu equipo.</p>
                  </div>
                  <span className="px-3 py-1 bg-brand-500/20 text-brand-300 text-xs font-medium rounded-full">
                    {members.length} Miembros
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5 text-slate-400">
                        <th className="px-6 py-4 font-medium">Usuario</th>
                        <th className="px-6 py-4 font-medium">Rol Asignado</th>
                        <th className="px-6 py-4 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loadingMembers ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                            Cargando usuarios...
                          </td>
                        </tr>
                      ) : (
                        members.map((member) => (
                          <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-semibold text-xs">
                                  {member.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div className="text-slate-200 font-medium">
                                    {member.email}
                                    {member.user_id === currentUser?.id && (
                                      <span className="ml-2 text-[10px] uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Tú</span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 text-xs mt-0.5">
                                    Añadido el {new Date(member.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="inline-flex flex-col">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  member.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                  member.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  member.role === 'validator' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                }`}>
                                  {roleDescriptions[member.role].title}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {member.role !== 'owner' && member.user_id !== currentUser?.id && (
                                <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Revocar acceso">
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="glass-card p-6 md:p-8 space-y-6 animate-fade-in text-center py-12">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-slate-300">Seguridad Avanzada</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                La configuración de políticas de contraseñas, 2FA y restricciones de IP estarán disponibles próximamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
