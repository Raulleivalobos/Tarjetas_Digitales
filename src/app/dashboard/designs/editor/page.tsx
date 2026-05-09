'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CardDesign,
  DesignElement,
  TextElement,
  CustomAttribute,
  AdditionalInfo,
  CardBackground,
  PaperFormat,
  DEFAULT_ATTRIBUTES,
  generateElementId,
} from '@/lib/cardDesignTypes';
import { CanvasPreview } from '@/components/designer/CanvasPreview';
import { FormatPanel } from '@/components/designer/FormatPanel';
import { TextPanel } from '@/components/designer/TextPanel';
import { ElementsPanel } from '@/components/designer/ElementsPanel';
import { AttributesPanel } from '@/components/designer/AttributesPanel';
import { BackgroundPanel } from '@/components/designer/BackgroundPanel';
import { AdditionalInfoPanel } from '@/components/designer/AdditionalInfoPanel';
import {
  ArrowLeft,
  FileText,
  Type,
  Image as ImageIcon,
  Code2,
  Paintbrush,
  ListOrdered,
  Eye,
  Save,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  AlertCircle,
  Download,
  CalendarDays,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { SuccessStamp } from '@/components/ui/SuccessStamp';
import { motion, AnimatePresence } from 'framer-motion';

type PanelTab = 'format' | 'text' | 'elements' | 'attributes' | 'background' | 'info';

const TABS: { key: PanelTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'format', label: 'FORMATO', icon: FileText },
  { key: 'text', label: 'TEXTO', icon: Type },
  { key: 'elements', label: 'ELEMENTOS', icon: ImageIcon },
  { key: 'attributes', label: 'ATRIBUTOS', icon: Code2 },
  { key: 'background', label: 'FONDO', icon: Paintbrush },
  { key: 'info', label: 'INFORMACIÓN', icon: ListOrdered },
];

function createDefaultDesign(orgId: string, name: string): CardDesign {
  const isCert = name.toLowerCase().includes('certificado');

  if (isCert) {
    return {
      id: generateElementId(),
      org_id: orgId,
      name: name || 'Certificado de Residencia',
      description: 'Formato oficial de certificado A4',
      width: 794,
      height: 1123,
      format: {
        paperSize: 'a4',
        orientation: 'vertical',
      },
      background: {
        type: 'solid',
        color: '#ffffff',
      },
      elements: [
        // Municipal Logo (Left)
        {
          type: 'image',
          data: {
            id: generateElementId(),
            type: 'logo',
            src: '/images/municipalidad-logo.png',
            x: 5,
            y: 3,
            width: 15,
            height: 10,
            rotation: 0,
            opacity: 1,
            borderRadius: 0,
            isAttribute: false,
          },
        },

        // Institutional Logo (Center)
        {
          type: 'image',
          data: {
            id: generateElementId(),
            type: 'logo',
            src: 'https://idadoqaekgeunztslgfm.supabase.co/storage/v1/object/public/logos/placeholder-logo.png',
            x: 43,
            y: 3,
            width: 14,
            height: 10,
            rotation: 0,
            opacity: 1,
            borderRadius: 0,
            isAttribute: true,
            attributeKey: 'Logo Institución'
          }
        },
        {
          type: 'text',
          data: {
            id: generateElementId(),
            content: '[Nombre Institución]',
            x: 20,
            y: 15,
            fontSize: 24,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: '700',
            color: '#1e293b',
            textAlign: 'center',
            isAttribute: true,
            attributeKey: 'Nombre Institución',
            width: 60,
            rotation: 0,
            opacity: 1,
            letterSpacing: 0,
            lineHeight: 1.2
          }
        },

        // Folio (Right Top)
        {
          type: 'text',
          data: {
            id: generateElementId(),
            content: 'Folio Nº: [Folio]',
            x: 75,
            y: 4,
            fontSize: 12,
            fontFamily: "'Inter', sans-serif",
            fontWeight: '700',
            color: '#0f172a',
            textAlign: 'right',
            isAttribute: false,
            width: 20,
            rotation: 0,
            opacity: 1,
            letterSpacing: 0,
            lineHeight: 1.2,
          },
        },

        // Valor (Right underneath Folio)
        {
          type: 'text',
          data: {
            id: generateElementId(),
            content: 'Valor: [Valor]',
            x: 75,
            y: 7, // Just below Folio
            fontSize: 12,
            fontFamily: "'Inter', sans-serif",
            fontWeight: '700',
            color: '#0f172a',
            textAlign: 'right',
            isAttribute: false,
            width: 20,
            rotation: 0,
            opacity: 1,
            letterSpacing: 0,
            lineHeight: 1.2,
          },
        },

        // Type Badge (Socio/Residente)
        {
          type: 'text',
          data: {
            id: generateElementId(),
            content: 'CALIDAD: [Tipo]',
            x: 5,
            y: 18,
            fontSize: 11,
            fontFamily: "'Inter', sans-serif",
            fontWeight: '800',
            color: '#64748b',
            textAlign: 'left',
            isAttribute: true,
            attributeKey: 'Tipo',
            width: 30,
            rotation: 0,
            opacity: 1,
            letterSpacing: 1,
            lineHeight: 1.2,
          },
        },

        // Main Title
        {
          type: 'text',
          data: {
            id: generateElementId(),
            content: 'CERTIFICADO DE RESIDENCIA',
            x: 0,
            y: 22,
            fontSize: 26,
            fontFamily: "'Inter', sans-serif",
            fontWeight: '900',
            color: '#1e293b',
            textAlign: 'center',
            isAttribute: false,
            width: 100,
            rotation: 0,
            opacity: 1,
            letterSpacing: 1,
            lineHeight: 1.2,
          },
        },

        // Expanded Body Text
        {
          type: 'text',
          data: {
            id: generateElementId(),
            content: 'Por intermedio de la presente, la Directiva de la Organización que suscribe, viene en certificar que el (la) Sr. (Sra.-Srta.):\n\n[Nombre receptor]\n\nCédula Nacional de Identidad N° [RUT receptor], actualmente mantiene su domicilio y residencia efectiva en la dirección ubicada en:\n\n[Dirección receptor]\n\nCorrespondiente a la villa o población [Villa receptor], en la Comuna de [Comuna], Provincia de [Provincia], [Región].',
            x: 10,
            y: 32,
            fontSize: 16,
            fontFamily: "'Inter', sans-serif",
            fontWeight: '400',
            color: '#1e293b',
            textAlign: 'left',
            isAttribute: false,
            width: 80,
            rotation: 0,
            opacity: 1,
            letterSpacing: 0,
            lineHeight: 2,
          },
        },

        {
          type: 'text',
          data: {
            id: generateElementId(),
            content: 'Se otorga el presente documento a petición del interesado para fines de: [Motivo], y tiene una validez legal de 90 días a contar de su fecha de emisión.',
            x: 10,
            y: 65,
            fontSize: 15,
            fontFamily: "'Inter', sans-serif",
            fontWeight: '400',
            color: '#334155',
            textAlign: 'left',
            isAttribute: false,
            width: 80,
            rotation: 0,
            opacity: 1,
            letterSpacing: 0,
            lineHeight: 1.6,
          },
        },

        // Footer Date
        {
          type: 'text',
          data: {
            id: generateElementId(),
            content: '[Comuna], [Fecha]',
            x: 10,
            y: 75,
            fontSize: 16,
            fontFamily: "'Inter', sans-serif",
            fontWeight: '600',
            color: '#0f172a',
            textAlign: 'left',
            isAttribute: false,
            width: 80,
            rotation: 0,
            opacity: 1,
            letterSpacing: 0,
            lineHeight: 1.6,
          },
        },

        // Signatures
        {
          type: 'shape',
          data: {
            id: generateElementId(),
            type: 'line',
            x: 10,
            y: 90,
            width: 35,
            height: 0.1,
            fill: '#1e293b',
            stroke: 'transparent',
            strokeWidth: 0,
            rotation: 0,
            opacity: 1,
            borderRadius: 0,
          },
        },
        {
          type: 'text',
          data: {
            id: generateElementId(),
            content: 'Presidente(a) Junta de Vecinos',
            x: 10,
            y: 92,
            fontSize: 11,
            fontFamily: "'Inter', sans-serif",
            fontWeight: '600',
            color: '#1e293b',
            textAlign: 'center',
            isAttribute: false,
            width: 35,
            rotation: 0,
            opacity: 1,
            letterSpacing: 0,
            lineHeight: 1.2,
          },
        },
        {
          type: 'shape',
          data: {
            id: generateElementId(),
            type: 'line',
            x: 55,
            y: 90,
            width: 35,
            height: 0.1,
            fill: '#1e293b',
            stroke: 'transparent',
            strokeWidth: 0,
            rotation: 0,
            opacity: 1,
            borderRadius: 0,
          },
        },
        {
          type: 'text',
          data: {
            id: generateElementId(),
            content: 'Secretaria(o) Junta de Vecinos',
            x: 55,
            y: 92,
            fontSize: 11,
            fontFamily: "'Inter', sans-serif",
            fontWeight: '600',
            color: '#1e293b',
            textAlign: 'center',
            isAttribute: false,
            width: 35,
            rotation: 0,
            opacity: 1,
            letterSpacing: 0,
            lineHeight: 1.2,
          },
        },

        // Validation QR (Centered between signatures)
        {
          type: 'qr',
          data: {
            id: generateElementId(),
            x: 45,
            y: 87,
            size: 10,
            foreground: '#0f172a',
            background: 'transparent',
          },
        },
      ],
      attributes: [...DEFAULT_ATTRIBUTES],
      additionalInfo: [],
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return {
    id: generateElementId(),
    org_id: orgId,
    name: name || 'Nuevo Diseño',
    description: '',
    width: 559,
    height: 432,
    format: {
      paperSize: 'carta',
      orientation: 'horizontal',
    },
    background: {
      type: 'gradient',
      gradientStart: '#1e293b',
      gradientEnd: '#0f172a',
      gradientAngle: 145,
    },
    elements: [
      {
        type: 'text',
        data: {
          id: generateElementId(),
          content: '[Nombre organización]',
          x: 5,
          y: 8,
          fontSize: 16,
          fontFamily: "'Inter', sans-serif",
          fontWeight: '700',
          color: '#ffffff',
          textAlign: 'left',
          isAttribute: true,
          attributeKey: 'Nombre Institución',
          width: 60,
          rotation: 0,
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
        },
      },
      {
        type: 'text',
        data: {
          id: generateElementId(),
          content: 'Se complace en emitirle a',
          x: 5,
          y: 25,
          fontSize: 11,
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
      },
      {
        type: 'text',
        data: {
          id: generateElementId(),
          content: '[Nombre receptor]',
          x: 5,
          y: 34,
          fontSize: 20,
          fontFamily: "'Inter', sans-serif",
          fontWeight: '700',
          color: '#ffffff',
          textAlign: 'left',
          isAttribute: true,
          attributeKey: 'Nombre Receptor',
          width: 70,
          rotation: 0,
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
        },
      },
      {
        type: 'text',
        data: {
          id: generateElementId(),
          content: 'el título de',
          x: 5,
          y: 48,
          fontSize: 11,
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
      },
      {
        type: 'text',
        data: {
          id: generateElementId(),
          content: '[Título emitido]',
          x: 5,
          y: 57,
          fontSize: 18,
          fontFamily: "'Inter', sans-serif",
          fontWeight: '700',
          color: '#ffffff',
          textAlign: 'left',
          isAttribute: true,
          attributeKey: 'Título Emitido',
          width: 80,
          rotation: 0,
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.2,
        },
      },
      {
        type: 'qr',
        data: {
          id: generateElementId(),
          x: 82,
          y: 72,
          size: 14,
          foreground: '#ffffff',
          background: 'rgba(15,23,42,0.8)',
        },
      },
      {
        type: 'text',
        data: {
          id: generateElementId(),
          content: 'Válida desde:',
          x: 22,
          y: 75,
          fontSize: 10,
          fontFamily: "'Inter', sans-serif",
          fontWeight: '400',
          color: '#64748b',
          textAlign: 'left',
          isAttribute: false,
          width: 30,
          rotation: 0,
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.4,
        },
      },
      {
        type: 'text',
        data: {
          id: generateElementId(),
          content: '[Fecha válida desde]',
          x: 22,
          y: 82,
          fontSize: 10,
          fontFamily: "'Inter', sans-serif",
          fontWeight: '500',
          color: '#94a3b8',
          textAlign: 'left',
          isAttribute: true,
          attributeKey: 'Fecha',
          width: 30,
          rotation: 0,
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.4,
        },
      },
      {
        type: 'shape',
        data: {
          id: generateElementId(),
          type: 'line',
          x: 5,
          y: 21,
          width: 90,
          height: 0.3,
          fill: 'rgba(99,102,241,0.15)',
          stroke: 'transparent',
          strokeWidth: 0,
          rotation: 0,
          opacity: 1,
          borderRadius: 0,
        },
      },
      {
        type: 'image',
        data: {
          id: generateElementId(),
          type: 'logo',
          src: '/images/skardkey-icon.png',
          x: 82,
          y: 5,
          width: 12,
          height: 12,
          rotation: 0,
          opacity: 1,
          borderRadius: 8,
          isAttribute: true,
          attributeKey: 'Logo',
        },
      },
    ],
    attributes: [...DEFAULT_ATTRIBUTES],
    additionalInfo: [],
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export default function CardDesignEditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { organization } = useAuth();
  const designId = searchParams.get('id');
  const designName = searchParams.get('name') || 'Nuevo Diseño';
  const canvasExportRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [design, setDesign] = useState<CardDesign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for save menu
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadDesign() {
      if (designId) {
        try {
          const { data, error } = await supabase
            .from('card_designs')
            .select('*')
            .eq('id', designId)
            .single();
            
          if (!error && data && isMounted) {
            // Map additional_info from DB if needed
            if (data.additional_info && !data.additionalInfo) {
              data.additionalInfo = data.additional_info;
            }
            if (!data.attributes) data.attributes = [...DEFAULT_ATTRIBUTES];
            if (!data.additionalInfo) data.additionalInfo = [];
            if (!data.elements) data.elements = [];
            setDesign(data as CardDesign);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error loading design:', err);
        }
      }
      
      if (isMounted) {
        // Fallback to new design
        const newDesign = createDefaultDesign(organization?.id || '', designName);
        // We set a temporary ID starting with 'new-' so we know it hasn't been saved yet
        newDesign.id = 'new-' + newDesign.id;
        setDesign(newDesign);
        setIsLoading(false);
      }
    }
    
    if (organization) {
      loadDesign();
    }
    
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designId, designName, organization]);
  const [activeTab, setActiveTab] = useState<PanelTab>('format');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [scale, setScale] = useState(1);

  // Adjust scale for large designs (A4) on load
  useEffect(() => {
    if (design && design.height > 600 && scale === 1) {
      // Calculate a scale that fits better (approx 0.55 for A4)
      setScale(0.55);
    }
  }, [design?.id]); // Only run when a new design is loaded
  const [saved, setSaved] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [history, setHistory] = useState<CardDesign[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  // Save to history
  const pushHistory = useCallback((newDesign: CardDesign) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newDesign]);
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Update design
  const updateDesign = useCallback(
    (updates: Partial<CardDesign>) => {
      setDesign((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, ...updates, updated_at: new Date().toISOString() };
        pushHistory(updated);
        return updated;
      });
      setSaved(false);
      setUnsaved(true);
    },
    [pushHistory]
  );

  // Migration: Ensure critical elements (Photo, Folio, Valor, Footer) are always correct
  // Uses a ref guard to run ONCE per design load, preventing infinite re-render loops
  const migrationDone = useRef(false);
  useEffect(() => {
    if (!design || isLoading || migrationDone.current) return;
    
    let needsUpdate = false;
    let newElements = [...design.elements];

    // 1. Photo migration
    const photoAttr = design.attributes.find(a => a.active && (a.label.toLowerCase().includes('foto') || a.label.toLowerCase().includes('imagen') || a.label.toLowerCase().includes('logo')));
    if (photoAttr) {
      const hasTextPhoto = design.elements.some(el => el.type === 'text' && el.data.isAttribute && el.data.attributeKey === photoAttr.label);
      const hasImagePhoto = design.elements.some(el => el.type === 'image' && el.data.isAttribute && el.data.attributeKey === photoAttr.label);
      
      if (hasTextPhoto && !hasImagePhoto) {
        const textEl = design.elements.find(el => el.type === 'text' && el.data.isAttribute && el.data.attributeKey === photoAttr.label);
        if (textEl && textEl.type === 'text') {
          newElements = newElements.filter(el => el.data.id !== textEl.data.id);
          newElements.push({
            type: 'image',
            data: {
              id: generateElementId(),
              type: 'photo',
              src: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
              x: textEl.data.x,
              y: textEl.data.y,
              width: textEl.data.width,
              height: textEl.data.width * 1.4,
              rotation: 0,
              opacity: 1,
              borderRadius: 8,
              isAttribute: true,
              attributeKey: photoAttr.label,
            }
          });
          needsUpdate = true;
        }
      }
    }

    // 2. Folio & Valor & Footer Enforcement
    const hasFolioAndValor = design.elements.some(el => el.type === 'text' && el.data.content.includes('Folio :'));
    const hasFooter = design.elements.some(el => el.type === 'text' && el.data.content.includes('Art. 210'));

    if (!hasFolioAndValor) {
      newElements = newElements.filter(el => !(el.type === 'text' && (el.data.content.includes('Folio') || el.data.content.includes('Valor') || el.data.content.includes('Precio'))));
      newElements.push({
        type: 'text',
        data: {
          id: 'forced-folio-editor',
          content: 'Folio : [Folio]',
          x: 72,
          y: 4,
          fontSize: 12,
          fontFamily: "'Inter', sans-serif",
          fontWeight: '700',
          color: '#0f172a',
          textAlign: 'right',
          isAttribute: false,
          width: 25,
          rotation: 0,
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.2,
        }
      });
      newElements.push({
        type: 'text',
        data: {
          id: 'forced-precio-editor',
          content: 'Precio $ : [Valor]',
          x: 72,
          y: 7,
          fontSize: 12,
          fontFamily: "'Inter', sans-serif",
          fontWeight: '700',
          color: '#0f172a',
          textAlign: 'right',
          isAttribute: false,
          width: 25,
          rotation: 0,
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.2,
        }
      });
      needsUpdate = true;
    }

    if (!hasFooter) {
      newElements.push({
        type: 'text',
        data: {
          id: 'forced-footer-editor',
          content: 'Datos declarados bajo responsabilidad exclusiva del titular. Su falsedad constituye delito penado por el Art. 210 del Código Penal, eximiendo a la emisora de toda responsabilidad. Validación exclusiva vía código QR.',
          x: 10,
          y: 94,
          fontSize: 8,
          fontFamily: "'Inter', sans-serif",
          fontWeight: '400',
          color: '#64748b',
          textAlign: 'center',
          isAttribute: false,
          width: 80,
          rotation: 0,
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.4,
        }
      });
      needsUpdate = true;
    }

    migrationDone.current = true;
    if (needsUpdate) {
      updateDesign({ elements: newElements });
    }
  }, [design, isLoading, updateDesign]);

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setDesign(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setDesign(history[historyIndex + 1]);
    }
  };

  // Element handlers
  const handleAddElement = (element: DesignElement) => {
    if (!design) return;
    updateDesign({ elements: [...design.elements, element] });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateElement = (id: string, updates: Record<string, any>) => {
    if (!design) return;
    updateDesign({
      elements: design.elements.map((el) =>
        el.data.id === id
          ? { ...el, data: { ...el.data, ...updates } as typeof el.data }
          : el
      ) as DesignElement[],
    });
  };

  const handleDeleteElement = (id: string) => {
    if (!design) return;
    updateDesign({ elements: design.elements.filter((el) => el.data.id !== id) });
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Text specific handlers
  const handleUpdateText = (id: string, updates: Partial<TextElement>) => {
    if (!design) return;
    updateDesign({
      elements: design.elements.map((el) =>
        el.type === 'text' && el.data.id === id
          ? { type: 'text' as const, data: { ...(el.data as TextElement), ...updates } }
          : el
      ) as DesignElement[],
    });
  };

  // Format handlers
  const handleUpdateFormat = (format: PaperFormat) => {
    updateDesign({ format });
  };

  const handleUpdateDimensions = (width: number, height: number) => {
    updateDesign({ width, height });
  };

  // Attribute handlers
  const handleAddAttribute = (attr: CustomAttribute) => {
    if (!design) return;
    
    const isImageAttr = attr.label.toLowerCase().includes('foto') || 
                       attr.label.toLowerCase().includes('imagen') || 
                       attr.label.toLowerCase().includes('logo') ||
                       attr.label.toLowerCase().includes('firma') ||
                       attr.label.toLowerCase().includes('signature');

    // Add a corresponding element to the canvas
    const newElement: DesignElement = isImageAttr ? {
      type: 'image',
      data: {
        id: generateElementId(),
        type: attr.label.toLowerCase().includes('firma') ? 'signature' : 'photo',
        src: attr.label.toLowerCase().includes('firma') 
          ? 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Jon_Kirsch%27s_Signature.png'
          : 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        x: 10,
        y: 10,
        width: attr.label.toLowerCase().includes('firma') ? 20 : 25,
        height: attr.label.toLowerCase().includes('firma') ? 8 : 35,
        rotation: 0,
        opacity: 1,
        borderRadius: attr.label.toLowerCase().includes('firma') ? 0 : 8,
        isAttribute: true,
        attributeKey: attr.label,
      }
    } : {
      type: 'text',
      data: {
        id: generateElementId(),
        content: attr.placeholder,
        x: 10,
        y: 10,
        fontSize: 14,
        fontFamily: "'Inter', sans-serif",
        fontWeight: '500',
        color: '#1e293b',
        textAlign: 'left',
        isAttribute: true,
        attributeKey: attr.label, // linking by label
        width: 40,
        rotation: 0,
        opacity: 1,
        letterSpacing: 0,
        lineHeight: 1.3,
      },
    };
    updateDesign({ 
      attributes: [...design.attributes, attr],
      elements: [...design.elements, newElement]
    });
  };

  const handleUpdateAttribute = (id: string, updates: Partial<CustomAttribute>) => {
    if (!design) return;
    const attribute = design.attributes.find((a) => a.id === id);
    let newElements = design.elements;
    let newPlaceholder = updates.placeholder;

    // If label is changed, we must update the linked text elements and the placeholder
    if (attribute && updates.label && updates.label !== attribute.label) {
      newPlaceholder = `[${updates.label}]`;
      newElements = design.elements.map((el) => {
        if ('isAttribute' in el.data && el.data.isAttribute && el.data.attributeKey === attribute.label) {
          return {
            ...el,
            data: {
              ...el.data,
              attributeKey: updates.label,
              // Update content if it's a text element and was using the old placeholder
              ...(el.type === 'text' 
                ? { content: (el.data as TextElement).content === attribute.placeholder ? newPlaceholder : (el.data as TextElement).content } 
                : {}
              ),
            },
          };
        }
        return el;
      }) as DesignElement[];
    }

    updateDesign({
      attributes: design.attributes.map((a) =>
        a.id === id ? { ...a, ...updates, ...(newPlaceholder ? { placeholder: newPlaceholder } : {}) } : a
      ),
      elements: newElements,
    });
  };

  const handleDeleteAttribute = (id: string) => {
    if (!design) return;
    const attribute = design.attributes.find((a) => a.id === id);
    const newAttributes = design.attributes.filter((a) => a.id !== id);
    
    // Also remove the corresponding element from the canvas
    let newElements = design.elements;
    if (attribute) {
      newElements = design.elements.filter(
        (el) => !('isAttribute' in el.data && el.data.isAttribute && el.data.attributeKey === attribute.label)
      );
    }
    
    updateDesign({ attributes: newAttributes, elements: newElements });
  };

  const handleToggleAttribute = (id: string) => {
    if (!design) return;
    const attribute = design.attributes.find((a) => a.id === id);
    if (!attribute) return;

    let newElements = design.elements;
    const isActivating = !attribute.active;

    // If activating and the element was deleted, recreate it
    if (isActivating) {
      const elementExists = design.elements.some(
        (el) => 'isAttribute' in el.data && el.data.isAttribute && el.data.attributeKey === attribute.label
      );
      if (!elementExists) {
        const isPhoto = attribute.label.toLowerCase().includes('foto') || 
                        attribute.label.toLowerCase().includes('imagen') || 
                        attribute.label.toLowerCase().includes('logo') ||
                        attribute.label.toLowerCase().includes('firma') ||
                        attribute.label.toLowerCase().includes('signature');
        let newElement: DesignElement;

        if (isPhoto) {
          // Remove any existing TextElement for 'Foto' to avoid conflicts
          newElements = design.elements.filter(
            (el) => !(el.type === 'text' && (el.data as TextElement).isAttribute && (el.data as TextElement).attributeKey === attribute.label)
          );
          
          newElement = {
            type: 'image',
            data: {
              id: generateElementId(),
              type: attribute.label.toLowerCase().includes('firma') ? 'signature' : 'photo',
              src: attribute.label.toLowerCase().includes('firma') 
                ? 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Jon_Kirsch%27s_Signature.png'
                : 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
              x: 10,
              y: 10,
              width: attribute.label.toLowerCase().includes('firma') ? 20 : 25,
              height: attribute.label.toLowerCase().includes('firma') ? 8 : 35,
              rotation: 0,
              opacity: 1,
              borderRadius: attribute.label.toLowerCase().includes('firma') ? 0 : 8,
              isAttribute: true,
              attributeKey: attribute.label,
            },
          };
          newElements = [...newElements, newElement];
        } else {
          newElement = {
            type: 'text',
            data: {
              id: generateElementId(),
              content: attribute.placeholder,
              x: 10,
              y: 10,
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              fontWeight: '500',
              color: '#ffffff',
              textAlign: 'left',
              isAttribute: true,
              attributeKey: attribute.label,
              width: 40,
              rotation: 0,
              opacity: 1,
              letterSpacing: 0,
              lineHeight: 1.3,
            },
          };
          newElements = [...newElements, newElement];
        }
      }
    }

    updateDesign({
      attributes: design.attributes.map((a) =>
        a.id === id ? { ...a, active: !a.active } : a
      ),
      elements: newElements,
    });
  };

  // Additional Info handlers
  const handleAddInfo = (info: AdditionalInfo) => {
    if (!design) return;
    updateDesign({ additionalInfo: [...design.additionalInfo, info] });
  };

  const handleUpdateInfo = (id: string, updates: Partial<AdditionalInfo>) => {
    if (!design) return;
    updateDesign({
      additionalInfo: design.additionalInfo.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    });
  };

  const handleDeleteInfo = (id: string) => {
    if (!design) return;
    updateDesign({ additionalInfo: design.additionalInfo.filter((i) => i.id !== id) });
  };

  const handleToggleInfoVisibility = (id: string) => {
    if (!design) return;
    updateDesign({
      additionalInfo: design.additionalInfo.map((i) =>
        i.id === id ? { ...i, visible: !i.visible } : i
      ),
    });
  };

  // Background handler
  const handleUpdateBackground = (bg: CardBackground) => {
    updateDesign({ background: bg });
  };

  // Save design
  const handleSave = async () => {
    if (!design || !organization) return;
    setIsSaving(true);

    // GENERATE THUMBNAIL (with 3s timeout to prevent hanging)
    let thumbnail = design.thumbnail;
    try {
      const canvasEl = document.getElementById('card-design-canvas');
      if (canvasEl) {
        const prevSelected = selectedElementId;
        if (prevSelected) setSelectedElementId(null);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const html2canvas = (await import('html2canvas')).default;
        const isA4 = design.width > 600 || design.height > 600;
        
        // Race: thumbnail generation vs 3s timeout
        const thumbnailPromise = html2canvas(canvasEl, {
          scale: isA4 ? 0.3 : 0.6,
          useCORS: true,
          backgroundColor: null,
          logging: false,
          ignoreElements: (el) => el.classList.contains('no-export'),
        }).then(canvas => canvas.toDataURL('image/jpeg', 0.4));
        
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
        
        const result = await Promise.race([thumbnailPromise, timeoutPromise]);
        if (result) thumbnail = result;
        
        if (prevSelected) setSelectedElementId(prevSelected);
      }
    } catch (e) {
      console.warn('Failed to generate thumbnail, saving data only', e);
    }

    try {
      const designToSave = { ...design, thumbnail, additional_info: design.additionalInfo };
      delete (designToSave as any).additionalInfo;
      
      const isNew = design.id.startsWith('new-');
      
      if (isNew) {
        const { id, ...insertData } = designToSave;
        insertData.org_id = organization.id;
        
        const { data, error } = await supabase
          .from('card_designs')
          .insert(insertData)
          .select()
          .single();
          
        if (error) throw error;
        
        if (data) {
          setDesign(data as CardDesign);
          // Update URL silently
          window.history.replaceState(null, '', `/dashboard/designs/editor?id=${data.id}`);
        }
      } else {
        const { error } = await supabase
          .from('card_designs')
          .update({
            name: designToSave.name,
            description: designToSave.description,
            width: designToSave.width,
            height: designToSave.height,
            format: designToSave.format,
            background: designToSave.background,
            elements: designToSave.elements,
            attributes: designToSave.attributes,
            additional_info: designToSave.additional_info,
            thumbnail: designToSave.thumbnail,
            updated_at: new Date().toISOString()
          })
          .eq('id', design.id);
          
        if (error) throw error;
        setDesign({ ...design, thumbnail });
      }

      setSaved(true);
      setUnsaved(false);
      
      // Delight: Show success stamp and glitch
      setIsGlitching(true);
      setShowSuccess(true);
      setTimeout(() => {
        setSaved(false);
        setShowSuccess(false);
        setIsGlitching(false);
      }, 2000);
    } catch (err) {
      console.error('Error saving design:', err);
      console.error('Error al guardar el diseño');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAs = async () => {
    if (!design || !saveAsName.trim() || !organization) return;

    let thumbnail = design.thumbnail;
    try {
      const canvasEl = document.getElementById('card-design-canvas');
      if (canvasEl) {
        const prevSelected = selectedElementId;
        if (prevSelected) setSelectedElementId(null);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(canvasEl, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });
        thumbnail = canvas.toDataURL('image/jpeg', 0.85);
        
        if (prevSelected) setSelectedElementId(prevSelected);
      }
    } catch (e) {
      console.warn('Failed to generate thumbnail', e);
    }

    try {
      const insertData = {
        org_id: organization.id,
        name: saveAsName.trim(),
        description: design.description,
        width: design.width,
        height: design.height,
        format: design.format,
        background: design.background,
        elements: design.elements,
        attributes: design.attributes,
        additional_info: design.additionalInfo,
        thumbnail: thumbnail,
        is_default: false
      };
      
      const { data, error } = await supabase
        .from('card_designs')
        .insert(insertData)
        .select()
        .single();
        
      if (error) throw error;

      if (data) {
        const newDesign = { ...data, additionalInfo: data.additional_info } as CardDesign;
        setDesign(newDesign);
        setSaved(true);
        setUnsaved(false);
        setShowSaveAsModal(false);
        
        // Delight
        setIsGlitching(true);
        setShowSuccess(true);
        setTimeout(() => {
          setSaved(false);
          setShowSuccess(false);
          setIsGlitching(false);
        }, 2000);
        
        // Update URL to the new ID without reloading the page
        window.history.replaceState(null, '', `/dashboard/designs/editor?id=${data.id}`);
      }
    } catch (err) {
      console.error('Error saving design as copy:', err);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    if (!design) return;
    const canvasEl = document.getElementById('card-design-canvas');
    if (!canvasEl) return;

    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Render at 2x scale for quality
      const canvas = await html2canvas(canvasEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      // Determine PDF orientation and size
      const isLandscape = design.format.orientation === 'horizontal';
      const orientation = isLandscape ? 'landscape' : 'portrait';

      // Map paper sizes to jsPDF format strings
      const paperMap: Record<string, string> = {
        carta: 'letter',
        a4: 'a4',
        oficio: 'legal',
        a5: 'a5',
        custom: 'a4',
      };

      const pdfFormat = paperMap[design.format.paperSize] || 'a4';

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: pdfFormat,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions to fit the page with margins
      const margin = 10; // mm
      const availW = pageWidth - margin * 2;
      const availH = pageHeight - margin * 2;

      const imgAspect = canvas.width / canvas.height;
      let drawW = availW;
      let drawH = drawW / imgAspect;

      if (drawH > availH) {
        drawH = availH;
        drawW = drawH * imgAspect;
      }

      const offsetX = margin + (availW - drawW) / 2;
      const offsetY = margin + (availH - drawH) / 2;

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);
      pdf.save(`${design.name || 'credencial'}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  // Filter elements by type
  const textElements = design?.elements.filter(
    (el): el is { type: 'text'; data: TextElement } => el.type === 'text'
  ) || [];

  if (isLoading || !design) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] -m-4 lg:-m-8 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 mt-4 text-sm">Cargando diseño...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 lg:-m-8 animate-fade-in">
      {/* Top Bar */}
      <div className="relative z-50 flex items-center justify-between px-4 py-3 border-b border-brand-500/10 bg-surface-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/designs"
            className="p-2 rounded-xl btn-ghost hover:bg-brand-500/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <input
              type="text"
              value={design.name}
              onChange={(e) => updateDesign({ name: e.target.value })}
              className="bg-transparent text-white font-bold text-base border-none focus:outline-none focus:ring-0 max-w-[240px] tracking-tight p-0"
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Editor de Credenciales</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Unsaved indicator */}
          {unsaved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" />
              Tienes cambios sin guardar
            </div>
          )}

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 mr-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg btn-ghost disabled:opacity-20 hover:bg-white/5 transition-all"
              title="Deshacer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg btn-ghost disabled:opacity-20 hover:bg-white/5 transition-all"
              title="Rehacer"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-surface-900/80 border border-brand-500/20">
            <button
              onClick={() => setScale(Math.max(0.3, scale - 0.1))}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-300 w-12 text-center font-mono font-bold">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(Math.min(2, scale + 0.1))}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-800 mx-1"></div>
            <button
              onClick={() => setScale(1)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Delete selected */}
          {selectedElementId && (
            <button
              onClick={() => handleDeleteElement(selectedElementId)}
              className="btn-danger px-3 py-2 text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          )}

          {/* Export PDF (top bar shortcut) */}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn-ghost px-3 py-2 text-xs flex items-center gap-1.5 text-slate-300 hover:text-white border border-brand-500/10"
            title="Descargar PDF"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exportando...' : 'PDF'}
          </button>

          {/* Preview */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 ${showPreview ? 'bg-brand-500/20 text-brand-200' : ''}`}
          >
            <Eye className="w-4 h-4" />
            <span>Previsualizar</span>
          </button>

          {/* Save Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSaveMenu(!showSaveMenu)}
              className={`btn-primary px-4 py-2 text-xs flex items-center gap-1.5 transition-all ${saved ? 'bg-emerald-600 scale-[1.05] shadow-[0_0_20px_rgba(16,185,129,0.3)]' : ''}`}
            >
              {saved ? (
                <Check className="w-4 h-4 relative z-10 animate-success-pop" />
              ) : isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
              ) : (
                <Save className="w-4 h-4 relative z-10" />
              )}
              <span className="relative z-10 font-bold uppercase tracking-widest text-[10px]">
                {saved ? 'Guardado' : isSaving ? 'Guardando...' : 'Guardar'}
              </span>
            </button>
            {showSaveMenu && (
              <>
                {/* Backdrop to close menu */}
                <div className="fixed inset-0 z-40" onClick={() => setShowSaveMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 glass-card-solid border-brand-500/30 shadow-2xl z-50 overflow-hidden animate-scale-in">
                  <button
                    onClick={() => { handleSave(); setShowSaveMenu(false); }}
                    className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-200 uppercase tracking-widest hover:bg-brand-500/10 transition-colors border-b border-brand-500/10 flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5 text-brand-400" />
                    Actualizar Diseño
                  </button>
                  <button
                    onClick={() => { 
                      setSaveAsName(`${design.name} (Copia)`);
                      setShowSaveAsModal(true); 
                      setShowSaveMenu(false); 
                    }}
                    className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-200 uppercase tracking-widest hover:bg-brand-500/10 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-brand-400" />
                    Guardar Copia
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tool Panels */}
        <div className="w-80 border-r border-brand-500/10 bg-surface-950/50 flex flex-col overflow-hidden flex-shrink-0">
          {/* Tabs */}
          <div className="flex flex-col border-b border-brand-500/10">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-3 px-5 py-4 text-[11px] font-bold transition-all border-l-2 tracking-widest ${
                  activeTab === key
                    ? 'bg-brand-500/10 text-white border-l-brand-500 shadow-[inset_4px_0_12px_rgba(99,102,241,0.1)]'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border-l-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === key ? 'text-brand-400' : 'text-slate-600'}`} />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'format' && (
              <FormatPanel
                format={design.format}
                cardWidth={design.width}
                cardHeight={design.height}
                onUpdateFormat={handleUpdateFormat}
                onUpdateDimensions={handleUpdateDimensions}
                onExportPDF={handleExportPDF}
              />
            )}
            {activeTab === 'text' && (
              <TextPanel
                textElements={textElements}
                selectedElementId={selectedElementId}
                onAddText={(el) => handleAddElement(el)}
                onUpdateText={handleUpdateText}
                onDeleteElement={handleDeleteElement}
                onSelectElement={setSelectedElementId}
              />
            )}
            {activeTab === 'elements' && (
              <ElementsPanel
                onAddImage={(el) => handleAddElement(el)}
                onAddShape={(el) => handleAddElement(el)}
                onAddQR={(el) => handleAddElement(el)}
              />
            )}
            {activeTab === 'attributes' && (
              <AttributesPanel
                attributes={design.attributes}
                onAddAttribute={handleAddAttribute}
                onUpdateAttribute={handleUpdateAttribute}
                onDeleteAttribute={handleDeleteAttribute}
                onToggleAttribute={handleToggleAttribute}
              />
            )}
            {activeTab === 'background' && (
              <BackgroundPanel
                background={design.background}
                onUpdateBackground={handleUpdateBackground}
              />
            )}
            {activeTab === 'info' && (
              <AdditionalInfoPanel
                infoItems={design.additionalInfo}
                onAddInfo={handleAddInfo}
                onUpdateInfo={handleUpdateInfo}
                onDeleteInfo={handleDeleteInfo}
                onToggleVisibility={handleToggleInfoVisibility}
              />
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-[#0a0e1a] flex items-center justify-center relative">
          {/* Grid pattern background */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Edit Mode Always */}
          <div className="relative z-10" ref={canvasExportRef}>
            <div className="relative group">
              <CanvasPreview
                design={design}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={handleUpdateElement}
                scale={scale}
              />
              
              {/* Scanline animation during save */}
              {isSaving && (
                <div className="absolute inset-0 z-[100] pointer-events-none rounded-2xl overflow-hidden">
                  <div className="animate-scan" />
                </div>
              )}
            </div>
          </div>

          {/* Exporting overlay */}
          {exporting && (
            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-surface-950/60 backdrop-blur-md rounded-2xl border border-brand-500/30 overflow-hidden">
              <div className="animate-tech-shimmer absolute inset-0" />
              <div className="relative z-10 flex flex-col items-center gap-4 p-8">
                <div className="w-16 h-16 border-4 border-brand-400/20 border-t-brand-400 rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.2)]" />
                <div className="text-center">
                  <p className="text-white font-mono font-bold uppercase tracking-[0.2em] text-sm mb-1">Exportando PDF</p>
                  <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest">Renderizando elementos de alta resolución</p>
                </div>
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-brand-500 animate-[technical-shimmer_1.5s_infinite] w-1/2" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save As Modal */}
      <Modal
        isOpen={showSaveAsModal}
        onClose={() => setShowSaveAsModal(false)}
        title="Nombre de tu diseño"
        size="sm"
      >
        <div className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-brand-300 mb-1 block">Nombre de tu diseño</label>
            <input
              type="text"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              className="w-full bg-transparent border border-brand-500/30 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-400"
              autoFocus
            />
          </div>
          
          <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
            {/* Mock tags input to match the screenshot layout exactly */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            Agregar etiquetas
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              disabled
              placeholder=""
              className="flex-1 bg-transparent border border-slate-700/50 rounded-lg px-3 py-2 text-sm opacity-50 cursor-not-allowed"
            />
            <button disabled className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium opacity-50 cursor-not-allowed">
              Crear etiqueta
            </button>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-brand-500/10 mt-4">
            <button
              onClick={() => setShowSaveAsModal(false)}
              className="px-6 py-2 text-sm text-brand-300 border border-brand-500/30 rounded-lg hover:bg-brand-500/10 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAs}
              className="btn-primary px-6 py-2 text-sm rounded-lg"
              disabled={!saveAsName.trim()}
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Previsualización"
        size="md"
      >
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-semibold text-white mb-6 border-b border-brand-500/10 pb-2 w-full text-center">
            Previsualizar credencial
          </h3>
          
          <div className="bg-surface-950 p-4 rounded-xl border border-brand-500/10 shadow-2xl overflow-hidden flex items-center justify-center" style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <CanvasPreview
              design={{
                ...design,
                elements: design.elements.map(el => {
                  if (el.type === 'text' && el.data.isAttribute) {
                    const label = el.data.attributeKey || '';
                    let previewText = `[${label}]`;
                    const lowerLabel = label.toLowerCase();
                    if (lowerLabel.includes('nombre') || lowerLabel.includes('receptor')) previewText = 'John Doe';
                    else if (lowerLabel.includes('rut')) previewText = '12.345.678-9';
                    else if (lowerLabel.includes('fecha')) previewText = '20/06/2024';
                    else if (lowerLabel.includes('status') || lowerLabel.includes('estado')) previewText = 'Socio Activo';
                    else if (lowerLabel.includes('direcc')) previewText = 'Av. Siempre Viva 742';
                    else if (lowerLabel.includes('socio') || lowerLabel.includes('id')) previewText = '10045';
                    
                    return { ...el, data: { ...el.data, content: previewText } };
                  }
                  
                  if (el.type === 'image' && el.data.isAttribute) {
                    const label = el.data.attributeKey || '';
                    const lowerLabel = label.toLowerCase();
                    if (lowerLabel.includes('foto') || lowerLabel.includes('imagen')) {
                      // Real-looking member photo for preview
                      return { 
                        ...el, 
                        data: { 
                          ...el.data, 
                          src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80' 
                        } 
                      };
                    }
                  }
                  
                  return el;
                })
              }}
              selectedElementId={null}
              onSelectElement={() => {}}
              onUpdateElement={() => {}}
              scale={Math.min(1, 400 / design.width)} // Scale to fit nicely in modal
            />
          </div>

          <div className="mt-6 flex items-start gap-3 bg-brand-500/10 border border-brand-500/20 p-4 rounded-xl w-full">
            <CalendarDays className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-brand-100 leading-relaxed">
              La fecha y datos presentados en esta credencial son un <strong>ejemplo</strong>.<br />
              Los datos reales se completarán automáticamente al momento de la <strong>emisión</strong>.
            </p>
          </div>
        </div>
      </Modal>

      {/* Global Delight Components */}
      <SuccessStamp isVisible={showSuccess} message="DISEÑO RESGUARDADO" />
    </div>
  );
}
