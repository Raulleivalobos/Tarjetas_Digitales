'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Save, Building2, Palette, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { organization, refreshOrganization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    primary_color: organization?.primary_color || '#6366f1',
    secondary_color: organization?.secondary_color || '#8b5cf6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    setLoading(true);
    setMessage({ text: '', type: '' });

    const { error } = await supabase
      .from('organizations')
      .update({
        name: formData.name,
        description: formData.description,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
      })
      .eq('id', organization.id);

    if (error) {
      setMessage({ text: 'Error al guardar configuración', type: 'error' });
    } else {
      setMessage({ text: 'Configuración guardada exitosamente', type: 'success' });
      await refreshOrganization();
    }
    setLoading(false);
  };

  if (!organization) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Configuración</h1>
        <p className="text-slate-400 mt-1">Administra los detalles de tu organización</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* Navigation/Tabs could go here */}
          <div className="glass-card p-4 space-y-2">
            <button className="w-full text-left px-4 py-2 rounded-lg bg-brand-500/10 text-brand-400 font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" /> General
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg text-slate-400 hover:bg-white/[0.05] hover:text-slate-300 transition-colors flex items-center gap-2">
              <Palette className="w-4 h-4" /> Personalización
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg text-slate-400 hover:bg-white/[0.05] hover:text-slate-300 transition-colors flex items-center gap-2">
              <Shield className="w-4 h-4" /> Seguridad
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-brand-500/10 pb-4">
              Información de la Organización
            </h2>

            {message.text && (
              <div className={`p-4 rounded-xl text-sm ${
                message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={organization.slug}
                  disabled
                  className="glass-input w-full px-4 py-2.5 text-sm opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">El identificador único no se puede cambiar.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 text-sm resize-none h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-500/10">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Color Principal</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-sm font-mono text-slate-400 uppercase">{formData.primary_color}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Color Secundario</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-sm font-mono text-slate-400 uppercase">{formData.secondary_color}</span>
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
          </form>
        </div>
      </div>
    </div>
  );
}
