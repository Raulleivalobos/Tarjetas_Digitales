'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { CardDesign, CardBackground } from '@/lib/cardDesignTypes';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Palette,
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Star,
  Eye,
  Clock,
  Sparkles,
  CreditCard,
  Award,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

function getBackgroundCSS(bg: CardBackground): string {
  if (bg.type === 'solid') return bg.color || '#0f172a';
  if (bg.type === 'gradient')
    return `linear-gradient(${bg.gradientAngle || 135}deg, ${bg.gradientStart || '#1e293b'} 0%, ${bg.gradientEnd || '#0f172a'} 100%)`;
  if (bg.type === 'image') return `url(${bg.imageUrl}) center/cover`;
  return '#0f172a';
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return new Date(dateStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

// Base templates
const BASE_TEMPLATES: Partial<CardDesign>[] = [
  {
    name: 'Credencial Clásica',
    description: 'Diseño clásico para credenciales de identificación',
    background: { type: 'gradient', gradientStart: '#1e293b', gradientEnd: '#0f172a', gradientAngle: 145 },
  },
  {
    name: 'Credencial Corporativa',
    description: 'Diseño profesional para empresas',
    background: { type: 'gradient', gradientStart: '#0c4a6e', gradientEnd: '#164e63', gradientAngle: 135 },
  },
  {
    name: 'Certificado de Residencia',
    description: 'Formato oficial A4 para juntas de vecinos (Fondo Claro)',
    background: { type: 'solid', color: '#ffffff' },
  },
];

type TabFilter = 'my-cards' | 'my-certificates' | 'base-credentials' | 'base-certificates';

export default function DesignsPage() {
  const router = useRouter();
  const { organization, loading: authLoading } = useAuth();
  const [designs, setDesigns] = useState<CardDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('my-cards');
  const [showNewDesignModal, setShowNewDesignModal] = useState(false);
  const [newDesignName, setNewDesignName] = useState('');
  const [newDesignType, setNewDesignType] = useState<'card' | 'certificate'>('card');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Load designs from Supabase
  const loadDesigns = useCallback(async () => {
    if (!organization) {
      if (!authLoading) setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('card_designs')
        .select('*')
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setDesigns(data);
      }
    } catch (e) {
      console.error('Error loading designs', e);
    } finally {
      setLoading(false);
    }
  }, [organization, authLoading, supabase]);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  const handleCreateDesign = () => {
    if (!newDesignName.trim()) return;
    const name = encodeURIComponent(newDesignName.trim());
    router.push(`/dashboard/designs/editor?name=${name}&type=${newDesignType}`);
  };

  const handleDeleteDesign = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('card_designs').delete().eq('id', id);
      
      if (error) {
        console.error('Error deleting design:', error);
        if (error.code === '23503') {
          setMessage({ text: 'No se puede eliminar: Este diseño está siendo usado en certificados ya emitidos.', type: 'error' });
        } else {
          setMessage({ text: 'Error al eliminar el diseño de la base de datos.', type: 'error' });
        }
      } else {
        setDesigns(prev => prev.filter(d => d.id !== id));
        setMessage({ text: 'Diseño eliminado correctamente.', type: 'success' });
      }
    } catch (e) {
      console.error('Error deleting design', e);
      setMessage({ text: 'Error inesperado al intentar borrar.', type: 'error' });
    } finally {
      setLoading(false);
      setDeleteConfirm(null);
      setMenuOpen(null);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleDuplicateDesign = async (design: CardDesign) => {
    try {
      const duplicate = {
        org_id: organization!.id,
        name: `${design.name} (copia)`,
        description: design.description,
        width: design.width,
        height: design.height,
        format: design.format,
        background: design.background,
        elements: design.elements,
        attributes: design.attributes,
        additional_info: design.additionalInfo || design.additional_info,
        thumbnail: design.thumbnail,
        design_type: design.design_type || 'card',
        is_default: false
      };
      const { data, error } = await supabase.from('card_designs').insert(duplicate).select().single();
      if (!error && data) {
        setDesigns([data, ...designs]);
      }
    } catch (e) {
      console.error('Error duplicating design', e);
    }
    setMenuOpen(null);
  };

  const filteredDesigns = designs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Messages */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-3 animate-slide-in-right ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Mis Diseños</h1>
          <p className="text-slate-400 mt-1">
            Crea diseños de credenciales para todas tus necesidades
          </p>
        </div>
        <button
          onClick={() => setShowNewDesignModal(true)}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Nuevo diseño</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="glass-card p-4 flex items-start gap-3 border-l-4 border-l-brand-400">
        <Sparkles className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-white">
            Crea diseños de credenciales para todas tus necesidades
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            En esta sección podrás crear nuevas credenciales. Los mismos servirán para que luego, al emitir, puedas seleccionar el diseño que prefieras para cada caso.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="text-lg font-semibold text-white">Diseños de credenciales</h3>

        {/* Tab filters */}
        <div className="flex items-center gap-1 border-b border-brand-500/10 pb-3">
          {[
            { key: 'my-cards' as const, label: 'Mis Credenciales', icon: CreditCard },
            { key: 'my-certificates' as const, label: 'Mis Certificados', icon: Award },
            { key: 'base-credentials' as const, label: 'Credenciales Base', icon: CreditCard },
            { key: 'base-certificates' as const, label: 'Certificados Base', icon: Award },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === key
                  ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar diseños..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-11 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Content based on active tab */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-80 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : (activeTab === 'my-cards' || activeTab === 'my-certificates') && (
        <>
          {filteredDesigns.filter(d => 
            activeTab === 'my-cards' 
              ? (d.design_type === 'card' || !d.design_type) 
              : d.design_type === 'certificate'
          ).length === 0 ? (
            <div className="glass-card">
              <EmptyState
                icon={<Palette className="w-8 h-8" />}
                title="No hay diseños"
                description='Crea tu primer diseño haciendo clic en "Nuevo diseño".'
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDesigns.filter(d => 
                activeTab === 'my-cards' 
                  ? (d.design_type === 'card' || !d.design_type) 
                  : d.design_type === 'certificate'
              ).map((design) => (
                <div
                  key={design.id}
                  className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-200 relative group flex flex-col transition-all hover:shadow-md hover:border-slate-300"
                >
                  {/* Thumbnail Container */}
                  <div
                    className="w-full h-56 bg-[#f8fafc] rounded-[16px] mb-4 overflow-hidden flex items-center justify-center relative cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/designs/editor?id=${design.id}`)}
                  >
                    {design.thumbnail ? (
                      <img 
                        src={design.thumbnail} 
                        alt={design.name} 
                        className="w-[90%] h-[90%] object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      // Fallback exact CSS mini-preview
                      <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-slate-50/50 group-hover:scale-105 transition-transform duration-300">
                        <div style={{ width: (design.width || 559) * 0.32, height: (design.height || 432) * 0.32 }}>
                          <div 
                            className="relative overflow-hidden shadow-md"
                            style={{
                              width: `${design.width || 559}px`,
                              height: `${design.height || 432}px`,
                              background: getBackgroundCSS(design.background),
                              transform: 'scale(0.32)',
                              transformOrigin: 'top left',
                              borderRadius: '20px'
                            }}
                          >
                            {/* Background overlay for images */}
                            {design.background?.type === 'image' && design.background.imageOpacity !== undefined && (
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: `rgba(0,0,0,${1 - (design.background.imageOpacity || 1)})`,
                                }}
                              />
                            )}
                            
                            {/* Exact Elements */}
                            {(design.elements || []).map((el) => {
                              if (el.type === 'text') {
                                if (el.data.isAttribute) {
                                  const attr = (design.attributes || []).find((a) => a.label === el.data.attributeKey);
                                  if (attr && !attr.active) return null;
                                }
                                return (
                                  <div
                                    key={el.data.id}
                                    style={{
                                      position: 'absolute',
                                      left: `${el.data.x}%`,
                                      top: `${el.data.y}%`,
                                      width: `${el.data.width}%`,
                                      fontSize: `${el.data.fontSize}px`,
                                      color: el.data.color,
                                      fontWeight: el.data.fontWeight,
                                      fontFamily: el.data.fontFamily,
                                      textAlign: el.data.textAlign,
                                      transform: `rotate(${el.data.rotation || 0}deg)`,
                                      opacity: el.data.opacity,
                                      letterSpacing: `${el.data.letterSpacing || 0}px`,
                                      lineHeight: el.data.lineHeight || 1.3,
                                      padding: '2px 4px',
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {el.data.isAttribute ? (el.data.attributeKey ? `[${el.data.attributeKey}]` : el.data.content) : el.data.content}
                                  </div>
                                );
                              }
                              if (el.type === 'shape') {
                                return (
                                  <div
                                    key={el.data.id}
                                    style={{
                                      position: 'absolute',
                                      left: `${el.data.x}%`,
                                      top: `${el.data.y}%`,
                                      width: `${el.data.width}%`,
                                      height: el.data.type === 'line' ? '2px' : `${el.data.height}%`,
                                      background: el.data.fill,
                                      border: el.data.strokeWidth > 0 ? `${el.data.strokeWidth}px solid ${el.data.stroke}` : 'none',
                                      borderRadius: el.data.type === 'circle' ? '50%' : `${el.data.borderRadius || 0}px`,
                                      transform: `rotate(${el.data.rotation || 0}deg)`,
                                      opacity: el.data.opacity,
                                    }}
                                  />
                                );
                              }
                              if (el.type === 'image') {
                                if (el.data.isAttribute) {
                                  const attr = (design.attributes || []).find((a) => a.label === el.data.attributeKey);
                                  if (attr && !attr.active) return null;
                                }
                                return (
                                  <div
                                    key={el.data.id}
                                    style={{
                                      position: 'absolute',
                                      left: `${el.data.x}%`,
                                      top: `${el.data.y}%`,
                                      width: `${el.data.width}%`,
                                      height: `${el.data.height}%`,
                                      borderRadius: `${el.data.borderRadius}px`,
                                      transform: `rotate(${el.data.rotation || 0}deg)`,
                                      opacity: el.data.opacity,
                                      overflow: 'hidden',
                                      background: el.data.isAttribute ? '#e2e8f0' : 'transparent',
                                    }}
                                  >
                                    <img 
                                      src={el.data.src} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Default badge */}
                    {design.is_default && (
                      <div className="absolute top-3 left-3 z-30">
                        <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-amber-500" />
                          Default
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="flex flex-col gap-1 pb-1">
                    <h3 className="font-medium text-slate-800 text-sm truncate pr-8">{design.name}</h3>
                  </div>

                  {/* Menu Button */}
                  <div className="absolute bottom-4 right-3 z-30">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === design.id ? null : design.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Dropdown menu */}
                    {menuOpen === design.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-scale-in text-slate-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/designs/editor?id=${design.id}`);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateDesign(design);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(design.id);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Base templates */}
      {(activeTab === 'base-credentials' || activeTab === 'base-certificates') && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {BASE_TEMPLATES.map((template, i) => (
            <div
              key={i}
              className="glass-card overflow-hidden group hover:border-brand-500/30 transition-all cursor-pointer"
              onClick={() => {
                setNewDesignName(template.name || '');
                setShowNewDesignModal(true);
              }}
            >
              <div
                className="h-48 relative"
                style={{
                  background: template.background
                    ? getBackgroundCSS(template.background)
                    : '#0f172a',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Palette className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <p className="text-sm text-white/50">Plantilla base</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-surface-900/90 backdrop-blur-sm px-4 py-2 rounded-xl text-sm text-white flex items-center gap-2 border border-brand-500/20">
                    <Plus className="w-4 h-4" />
                    Usar plantilla
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-sm">{template.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Design Modal */}
      <Modal
        isOpen={showNewDesignModal}
        onClose={() => {
          setShowNewDesignModal(false);
          setNewDesignName('');
        }}
        title="Nombre de tu diseño"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Nombre de tu diseño</label>
            <input
              type="text"
              value={newDesignName}
              onChange={(e) => setNewDesignName(e.target.value)}
              placeholder="Mi diseño personalizado"
              className="glass-input w-full px-4 py-3 text-sm"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDesign()}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Tipo de diseño</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setNewDesignType('card')}
                className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  newDesignType === 'card' 
                    ? 'bg-brand-500/20 border-brand-500 text-white' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-medium">Credencial</span>
              </button>
              <button
                onClick={() => setNewDesignType('certificate')}
                className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  newDesignType === 'certificate' 
                    ? 'bg-brand-500/20 border-brand-500 text-white' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Award className="w-5 h-5" />
                <span className="text-sm font-medium">Certificado</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowNewDesignModal(false);
                setNewDesignName('');
              }}
              className="btn-ghost px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateDesign}
              disabled={!newDesignName.trim()}
              className="btn-primary px-6 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="relative z-10">Confirmar</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar diseño"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            ¿Estás seguro de que deseas eliminar este diseño? Esta acción no se puede deshacer.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="btn-ghost px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteConfirm && handleDeleteDesign(deleteConfirm)}
              className="btn-danger px-6 py-2 text-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
}
