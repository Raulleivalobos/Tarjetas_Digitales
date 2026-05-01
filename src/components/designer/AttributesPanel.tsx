'use client';

import { CustomAttribute, generateElementId } from '@/lib/cardDesignTypes';
import {
  Code2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { useState } from 'react';

interface AttributesPanelProps {
  attributes: CustomAttribute[];
  onAddAttribute: (attr: CustomAttribute) => void;
  onUpdateAttribute: (id: string, updates: Partial<CustomAttribute>) => void;
  onDeleteAttribute: (id: string) => void;
  onToggleAttribute: (id: string) => void;
}

export function AttributesPanel({
  attributes,
  onAddAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
  onToggleAttribute,
}: AttributesPanelProps) {
  const [newAttrLabel, setNewAttrLabel] = useState('');
  const [newAttrKey, setNewAttrKey] = useState('');

  const handleAdd = () => {
    if (!newAttrLabel.trim()) return;
    const key = newAttrKey.trim() || newAttrLabel.trim().toLowerCase().replace(/\s+/g, '_');
    onAddAttribute({
      id: generateElementId(),
      key,
      label: newAttrLabel.trim(),
      active: true,
      placeholder: `[${newAttrLabel.trim()}]`,
    });
    setNewAttrLabel('');
    setNewAttrKey('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-brand-400" />
          Atributos
        </h4>
        <p className="text-xs text-slate-500">
          Los atributos son campos dinámicos que se reemplazan al emitir la tarjeta.
        </p>
      </div>

      {/* Quick Suggestions for Certificates */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] font-mono">
          SUGERENCIAS RÁPIDAS
        </h4>
        <div className="flex flex-wrap gap-2">
          {['Folio', 'Valor', 'Motivo', 'Fecha', 'Nombre receptor', 'Dirección receptor', 'Villa receptor', 'Nombre Institución', 'Nombre Presidente', 'Nombre Secretario', 'Firma Presidente', 'Firma Secretario'].map((sug) => (
            <button
              key={sug}
              onClick={() => {
                onAddAttribute({
                  id: generateElementId(),
                  key: sug,
                  label: sug,
                  active: true,
                  placeholder: `[${sug}]`,
                });
              }}
              className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:bg-brand-500/20 hover:border-brand-500/40 hover:text-brand-300 transition-all"
            >
              + {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Add new attribute */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] font-mono">
          AGREGAR ATRIBUTO PERSONALIZADO
        </h4>
        <div className="space-y-2">
          <input
            type="text"
            value={newAttrLabel}
            onChange={(e) => setNewAttrLabel(e.target.value)}
            placeholder="Nombre del atributo (ej: Carrera)"
            className="glass-input w-full px-3 py-2 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="text"
            value={newAttrKey}
            onChange={(e) => setNewAttrKey(e.target.value)}
            placeholder="Clave (ej: career) - opcional"
            className="glass-input w-full px-3 py-2 text-xs font-mono"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={!newAttrLabel.trim()}
            className="btn-primary w-full px-3 py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="relative z-10">Agregar Atributo</span>
          </button>
        </div>
      </div>

      {/* Attributes list */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 font-mono">
          ATRIBUTOS CONFIGURADOS ({attributes.length})
        </h4>
        
        {attributes.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Code2 className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No hay atributos personalizados</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {attributes.map((attr) => (
              <div
                key={attr.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                  attr.active
                    ? 'bg-brand-500/10 border-brand-500/30 shadow-[0_4px_12px_rgba(99,102,241,0.1)]'
                    : 'bg-surface-900/30 border-white/5 opacity-50 grayscale'
                }`}
              >
                <GripVertical className="w-3 h-3 text-slate-600 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={attr.label}
                    onChange={(e) => onUpdateAttribute(attr.id, { label: e.target.value })}
                    className="bg-transparent border-none text-[11px] text-white font-bold w-full focus:outline-none focus:ring-0 p-0"
                  />
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] text-brand-400 font-mono opacity-60">KEY:</span>
                    <p className="text-[9px] text-slate-400 font-mono truncate tracking-tight">{attr.key}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Active badge */}
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      attr.active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}
                  >
                    {attr.active ? 'Activo' : 'Off'}
                  </span>

                  {/* Toggle */}
                  <button
                    onClick={() => onToggleAttribute(attr.id)}
                    className="p-1 text-slate-400 hover:text-brand-300 transition-colors"
                  >
                    {attr.active ? (
                      <ToggleRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteAttribute(attr.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-3">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          <span className="text-brand-300 font-semibold">Tip:</span> Los atributos obligatorios como
          Nombre Institución, Nombre Receptor, Título y Fecha se agregan automáticamente.
          Puedes añadir atributos personalizados como &quot;Carrera&quot;, &quot;Departamento&quot;, etc.
        </p>
      </div>
    </div>
  );
}
