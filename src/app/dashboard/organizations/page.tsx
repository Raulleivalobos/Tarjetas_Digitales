'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Plus, ArrowRight, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function OrganizationsPage() {
  const { user, memberships, refreshOrganization, switchOrganization } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [templateOrgId, setTemplateOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Solo mostrar organizaciones donde es owner o admin para usar como plantilla
  const templateOrgs = memberships.filter(m => m.role === 'owner' || m.role === 'admin');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const supabase = createClient();

    try {
      const slug = newOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 1000);

      // 1. Create Organization
      const { error: rpcError } = await supabase.rpc('create_new_organization', {
        org_name: newOrgName,
        org_slug: slug
      });

      if (rpcError) throw new Error('Error al crear la organización: ' + rpcError.message);

      // 2. If a template was selected, copy designs
      if (templateOrgId) {
        // Find the newly created org to get its ID
        const { data: newOrg, error: fetchError } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', slug)
          .single();

        if (fetchError || !newOrg) {
          throw new Error('Organización creada, pero falló al obtener su ID para copiar diseños.');
        }

        // Fetch designs from template
        const { data: designs, error: designsError } = await supabase
          .from('card_designs')
          .select('*')
          .eq('org_id', templateOrgId);

        if (designsError) throw new Error('Organización creada, pero falló al obtener los diseños de la plantilla.');

        if (designs && designs.length > 0) {
          // Prepare new designs
          const newDesigns = designs.map(d => {
            const { id, created_at, updated_at, org_id, ...designData } = d;
            return {
              ...designData,
              org_id: newOrg.id,
            };
          });

          const { error: insertError } = await supabase
            .from('card_designs')
            .insert(newDesigns);

          if (insertError) {
            console.error('Error copying designs:', insertError);
            throw new Error('Organización creada, pero hubo un error al copiar los diseños.');
          }
        }
      }

      setSuccess('¡Organización creada con éxito!');
      setNewOrgName('');
      setTemplateOrgId('');
      setIsCreating(false);
      
      // Refresh user memberships
      await refreshOrganization();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error inesperado al crear la organización.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase">Mis Organizaciones</h1>
        <p className="text-slate-400 mt-1">Administra tus organizaciones o crea una nueva.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de organizaciones */}
        <div className="lg:col-span-2 space-y-4">
          {memberships.map((m) => (
            <div key={m.id} className="glass-card p-5 flex items-center justify-between hover:border-brand-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{m.organizations?.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono uppercase text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                      Rol: {m.role}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ID: {m.organizations?.slug}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => switchOrganization(m.org_id)}
                className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm"
              >
                Ingresar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Panel lateral: Crear Organización */}
        <div>
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-400" />
              Crear Organización
            </h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2 text-emerald-400 text-sm">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                Nueva Organización
              </button>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Nombre de la Institución
                  </label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Ej: JJVV Parque San Carlos..."
                    className="glass-input w-full px-4 py-3 text-sm"
                    required
                  />
                </div>

                {templateOrgs.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Copy className="w-3 h-3" />
                      Copiar Diseños de:
                    </label>
                    <select
                      value={templateOrgId}
                      onChange={(e) => setTemplateOrgId(e.target.value)}
                      className="glass-input w-full px-4 py-3 text-sm appearance-none cursor-pointer"
                    >
                      <option value="">-- No copiar (Org. en blanco) --</option>
                      {templateOrgs.map(m => (
                        <option key={m.org_id} value={m.org_id}>
                          {m.organizations?.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">
                      Esto copiará los diseños de credenciales de la organización seleccionada para que no tengas que crearlos de nuevo.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setError('');
                    }}
                    className="flex-1 btn-ghost py-3"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newOrgName.trim()}
                    className="flex-1 btn-primary py-3"
                  >
                    {loading ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
