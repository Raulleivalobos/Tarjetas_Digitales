'use client';

import { AdditionalInfo, generateElementId } from '@/lib/cardDesignTypes';
import {
  ListOrdered,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  Info,
} from 'lucide-react';
import { useState } from 'react';

interface AdditionalInfoPanelProps {
  infoItems: AdditionalInfo[];
  onAddInfo: (info: AdditionalInfo) => void;
  onUpdateInfo: (id: string, updates: Partial<AdditionalInfo>) => void;
  onDeleteInfo: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function AdditionalInfoPanel({
  infoItems,
  onAddInfo,
  onUpdateInfo,
  onDeleteInfo,
  onToggleVisibility,
}: AdditionalInfoPanelProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    onAddInfo({
      id: generateElementId(),
      label: newLabel.trim(),
      value: newValue.trim() || '',
      visible: true,
    });
    setNewLabel('');
    setNewValue('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-brand-400" />
          Información Adicional
        </h4>
        <p className="text-xs text-slate-500">
          Agrega datos adicionales que aparecerán en el reverso o al detalle de la tarjeta.
        </p>
      </div>

      {/* Add new info */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Agregar información
        </h4>
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Etiqueta (ej: Departamento)"
          className="glass-input w-full px-3 py-2 text-xs"
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Valor por defecto (opcional)"
          className="glass-input w-full px-3 py-2 text-xs"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!newLabel.trim()}
          className="btn-primary w-full px-3 py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="relative z-10">Agregar</span>
        </button>
      </div>

      {/* Info items list */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Campos de información ({infoItems.length})
        </h4>

        {infoItems.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Info className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Sin información adicional</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Agrega campos como teléfono, dirección, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {infoItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border transition-all ${
                  item.visible
                    ? 'bg-surface-900/50 border-brand-500/10'
                    : 'bg-surface-900/20 border-transparent opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <GripVertical className="w-3 h-3 text-slate-600 flex-shrink-0 cursor-grab" />
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => onUpdateInfo(item.id, { label: e.target.value })}
                      className="bg-transparent border-none text-xs text-white font-medium w-full focus:outline-none"
                      placeholder="Etiqueta"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => onUpdateInfo(item.id, { value: e.target.value })}
                      className="bg-transparent border-none text-[10px] text-slate-400 w-full focus:outline-none"
                      placeholder="Valor por defecto..."
                    />
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => onToggleVisibility(item.id)}
                      className="p-1.5 text-slate-400 hover:text-brand-300 transition-colors"
                      title={item.visible ? 'Ocultar' : 'Mostrar'}
                    >
                      {item.visible ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteInfo(item.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested fields */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Sugerencias
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Teléfono',
            'Email',
            'Dirección',
            'Departamento',
            'Cargo',
            'Sede',
            'Fecha Nacimiento',
            'N° Empleado',
          ].map((suggestion) => {
            const exists = infoItems.some((i) => i.label === suggestion);
            return (
              <button
                key={suggestion}
                disabled={exists}
                onClick={() =>
                  onAddInfo({
                    id: generateElementId(),
                    label: suggestion,
                    value: '',
                    visible: true,
                  })
                }
                className={`px-2.5 py-1 text-[10px] rounded-full transition-all ${
                  exists
                    ? 'bg-surface-900/30 text-slate-600 cursor-not-allowed'
                    : 'bg-brand-500/5 text-brand-300 border border-brand-500/10 hover:bg-brand-500/15 hover:border-brand-500/30'
                }`}
              >
                + {suggestion}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
