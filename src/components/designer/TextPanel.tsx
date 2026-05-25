'use client';

import { TextElement, AVAILABLE_FONTS, generateElementId } from '@/lib/cardDesignTypes';
import {
  Type,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
} from 'lucide-react';
import { useState } from 'react';

interface TextPanelProps {
  textElements: { type: 'text'; data: TextElement }[];
  selectedElementId: string | null;
  onAddText: (element: { type: 'text'; data: TextElement }) => void;
  onUpdateText: (id: string, updates: Partial<TextElement>) => void;
  onDeleteElement: (id: string) => void;
  onSelectElement: (id: string) => void;
}

export function TextPanel({
  textElements,
  selectedElementId,
  onAddText,
  onUpdateText,
  onDeleteElement,
  onSelectElement,
}: TextPanelProps) {
  const [newText, setNewText] = useState('');

  const selectedElement = textElements.find((el) => el.data.id === selectedElementId);

  const handleAddText = () => {
    const text = newText.trim() || 'Nuevo texto';
    const element: { type: 'text'; data: TextElement } = {
      type: 'text',
      data: {
        id: generateElementId(),
        content: text,
        x: 10,
        y: 30 + (textElements.length % 6) * 10,
        fontSize: 16,
        fontFamily: "'Inter', sans-serif",
        fontWeight: '400',
        color: '#ffffff',
        textAlign: 'left',
        isAttribute: false,
        width: 80,
        rotation: 0,
        opacity: 1,
        letterSpacing: 0,
        lineHeight: 1.4,
      },
    };
    onAddText(element);
    setNewText('');
  };

  const handleAddAttribute = (attrLabel: string, attrKey: string) => {
    const element: { type: 'text'; data: TextElement } = {
      type: 'text',
      data: {
        id: generateElementId(),
        content: `[${attrLabel}]`,
        x: 10,
        y: 30 + (textElements.length % 6) * 10,
        fontSize: 18,
        fontFamily: "'Inter', sans-serif",
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'left',
        isAttribute: true,
        attributeKey: attrLabel,
        width: 80,
        rotation: 0,
        opacity: 1,
        letterSpacing: 0,
        lineHeight: 1.4,
      },
    };
    onAddText(element);
    void attrKey;
  };

  return (
    <div className="space-y-5">
      {/* Add Text */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Type className="w-4 h-4 text-brand-400" />
          Agregar texto
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Escribe un texto..."
            className="glass-input flex-1 px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
          />
          <button
            onClick={handleAddText}
            className="btn-primary px-3 py-2 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick attribute texts */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 font-mono">
          TEXTOS RÁPIDOS
        </h4>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { label: 'Se complace en emitirle a', key: 'intro' },
            { label: 'el título de', key: 'title_intro' },
            { label: 'Enviado el:', key: 'date_label' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                const el: { type: 'text'; data: TextElement } = {
                  type: 'text',
                  data: {
                    id: generateElementId(),
                    content: item.label,
                    x: 10,
                    y: 30 + (textElements.length % 6) * 10,
                    fontSize: 12,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '400',
                    color: '#94a3b8',
                    textAlign: 'left',
                    isAttribute: false,
                    width: 80,
                    rotation: 0,
                    opacity: 1,
                    letterSpacing: 0,
                    lineHeight: 1.4,
                  },
                };
                onAddText(el);
              }}
              className="text-left px-3 py-2 text-xs text-slate-300 bg-surface-900/50 hover:bg-brand-500/10 border border-brand-500/10 rounded-lg transition-all hover:border-brand-500/25"
            >
              &quot;{item.label}&quot;
            </button>
          ))}
        </div>
      </div>

      {/* Attribute fields */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 font-mono">
          CAMPOS DINÁMICOS
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Nombre Institución', key: 'institution_name' },
            { label: 'Nombre Receptor', key: 'recipient_name' },
            { label: 'Título Emitido', key: 'title' },
            { label: 'Fecha', key: 'date' },
            { label: 'RUT', key: 'rut' },
            { label: 'N° Tarjeta', key: 'card_number' },
          ].map((attr) => (
            <button
              key={attr.key}
              onClick={() => handleAddAttribute(attr.label, attr.key)}
              className="text-left px-3 py-2 text-xs text-brand-300 bg-brand-500/5 hover:bg-brand-500/15 border border-brand-500/15 rounded-lg transition-all hover:border-brand-500/30 flex items-center gap-1.5"
            >
              <span className="text-brand-400/60">{`{}`}</span>
              {attr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text elements list */}
      {textElements.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Textos en el diseño ({textElements.length})
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {textElements.map((el) => (
              <div
                key={el.data.id}
                onClick={() => onSelectElement(el.data.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all text-xs ${
                  selectedElementId === el.data.id
                    ? 'bg-brand-500/15 border border-brand-500/30 text-white'
                    : 'bg-surface-900/50 border border-transparent text-slate-300 hover:bg-surface-900'
                }`}
              >
                <span className="truncate flex-1">
                  {el.data.isAttribute ? `[${el.data.attributeKey}]` : el.data.content}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteElement(el.data.id);
                  }}
                  className="ml-2 text-slate-500 hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Text Properties */}
      {selectedElement && (
        <div className="border-t border-brand-500/10 pt-4 space-y-3">
        <h4 className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] font-mono">
          PROPIEDADES DEL ELEMENTO
        </h4>

          {/* Content */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Contenido</label>
            <input
              type="text"
              value={selectedElement.data.content}
              onChange={(e) => onUpdateText(selectedElement.data.id, { content: e.target.value })}
              className="glass-input w-full px-3 py-1.5 text-xs"
            />
          </div>

          {/* Font Family */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Tipografía</label>
            <select
              value={selectedElement.data.fontFamily}
              onChange={(e) => onUpdateText(selectedElement.data.id, { fontFamily: e.target.value })}
              className="glass-input w-full px-3 py-1.5 text-xs"
            >
              {AVAILABLE_FONTS.map((f) => (
                <option key={f.value} value={f.value}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tamaño</label>
              <input
                type="number"
                min={8}
                max={72}
                value={selectedElement.data.fontSize}
                onChange={(e) => onUpdateText(selectedElement.data.id, { fontSize: Number(e.target.value) })}
                className="glass-input w-full px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Estilo</label>
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdateText(selectedElement.data.id, {
                    fontWeight: selectedElement.data.fontWeight === '700' ? '400' : '700'
                  })}
                  className={`flex-1 p-1.5 rounded-lg transition-colors ${
                    selectedElement.data.fontWeight === '700'
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'bg-surface-900/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <Bold className="w-3.5 h-3.5 mx-auto" />
                </button>
                <button
                  onClick={() => onUpdateText(selectedElement.data.id, {
                    fontWeight: selectedElement.data.fontWeight === '300' ? '400' : '300'
                  })}
                  className={`flex-1 p-1.5 rounded-lg transition-colors ${
                    selectedElement.data.fontWeight === '300'
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'bg-surface-900/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <Italic className="w-3.5 h-3.5 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block font-mono">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedElement.data.color}
                onChange={(e) => onUpdateText(selectedElement.data.id, { color: e.target.value })}
                className="w-10 h-8 rounded-lg border border-brand-500/20 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={selectedElement.data.color}
                onChange={(e) => onUpdateText(selectedElement.data.id, { color: e.target.value })}
                className="glass-input flex-1 px-3 py-1.5 text-xs font-mono font-bold text-brand-300"
              />
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Alineación</label>
            <div className="flex gap-1">
              {[
                { value: 'left' as const, icon: AlignLeft },
                { value: 'center' as const, icon: AlignCenter },
                { value: 'right' as const, icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => onUpdateText(selectedElement.data.id, { textAlign: value })}
                  className={`flex-1 p-1.5 rounded-lg transition-colors ${
                    selectedElement.data.textAlign === value
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'bg-surface-900/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mx-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block font-mono">Pos. X (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={selectedElement.data.x}
                onChange={(e) => onUpdateText(selectedElement.data.id, { x: Number(e.target.value) })}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block font-mono">Pos. Y (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={selectedElement.data.y}
                onChange={(e) => onUpdateText(selectedElement.data.id, { y: Number(e.target.value) })}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Width & Opacity */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Ancho (%)</label>
              <input
                type="number"
                min={10}
                max={100}
                value={selectedElement.data.width}
                onChange={(e) => onUpdateText(selectedElement.data.id, { width: Number(e.target.value) })}
                className="glass-input w-full px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Opacidad</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selectedElement.data.opacity}
                onChange={(e) => onUpdateText(selectedElement.data.id, { opacity: Number(e.target.value) })}
                className="w-full mt-1.5"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
