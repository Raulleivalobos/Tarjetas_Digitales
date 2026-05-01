// =====================================================
// Card Design Types
// =====================================================

export type PaperSize = 'carta' | 'a4' | 'oficio' | 'a5' | 'custom';
export type Orientation = 'horizontal' | 'vertical';

export interface PaperFormat {
  paperSize: PaperSize;
  orientation: Orientation;
  customWidth?: number;  // mm
  customHeight?: number; // mm
}

export const PAPER_SIZES: { key: PaperSize; label: string; widthMm: number; heightMm: number }[] = [
  { key: 'carta', label: 'Carta', widthMm: 279.4, heightMm: 215.9 },
  { key: 'a4', label: 'A4', widthMm: 297, heightMm: 210 },
  { key: 'oficio', label: 'Oficio', widthMm: 355.6, heightMm: 215.9 },
  { key: 'a5', label: 'A5', widthMm: 210, heightMm: 148 },
  { key: 'custom', label: 'Personalizado', widthMm: 300, heightMm: 200 },
];

export interface TextElement {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  isAttribute: boolean;
  attributeKey?: string;
  width: number;
  rotation: number;
  opacity: number;
  letterSpacing: number;
  lineHeight: number;
}

export interface ImageElement {
  id: string;
  type: 'logo' | 'decoration' | 'photo' | 'icon' | 'signature';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  borderRadius: number;
  isAttribute?: boolean;
  attributeKey?: string;
}

export interface ShapeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'divider';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
  opacity: number;
  borderRadius: number;
}

export interface QRElement {
  id: string;
  x: number;
  y: number;
  size: number;
  foreground: string;
  background: string;
}

export type DesignElement =
  | { type: 'text'; data: TextElement }
  | { type: 'image'; data: ImageElement }
  | { type: 'shape'; data: ShapeElement }
  | { type: 'qr'; data: QRElement };

export interface CardBackground {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  imageUrl?: string;
  imageOpacity?: number;
}

export interface CustomAttribute {
  id: string;
  key: string;
  label: string;
  active: boolean;
  placeholder: string;
}

export interface AdditionalInfo {
  id: string;
  label: string;
  value: string;
  visible: boolean;
}

export interface CardDesign {
  id: string;
  org_id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  format: PaperFormat;
  background: CardBackground;
  elements: DesignElement[];
  attributes: CustomAttribute[];
  additionalInfo: AdditionalInfo[];
  additional_info?: AdditionalInfo[]; // DB representation
  is_default: boolean;
  created_at: string;
  updated_at: string;
  thumbnail?: string;
}

export interface CardDesignFormData {
  name: string;
  description?: string;
  width?: number;
  height?: number;
  background?: CardBackground;
  elements?: DesignElement[];
  attributes?: CustomAttribute[];
  additionalInfo?: AdditionalInfo[];
}

// Default attribute presets
export const DEFAULT_ATTRIBUTES: CustomAttribute[] = [
  { id: 'attr-1', key: 'institution_name', label: 'Nombre Institución', active: true, placeholder: '[Nombre Institución]' },
  { id: 'attr-2', key: 'recipient_name', label: 'Nombre Receptor', active: true, placeholder: '[Nombre Receptor]' },
  { id: 'attr-3', key: 'title', label: 'Título Emitido', active: true, placeholder: '[Título Emitido]' },
  { id: 'attr-4', key: 'date', label: 'Fecha', active: true, placeholder: '[Fecha]' },
  { id: 'attr-5', key: 'institution_rut', label: 'RUT Institución', active: false, placeholder: '[RUT Institución]' },
  { id: 'attr-6', key: 'institution_address', label: 'Dirección', active: false, placeholder: '[Dirección]' },
  { id: 'attr-7', key: 'institution_commune', label: 'Comuna', active: false, placeholder: '[Comuna]' },
  { id: 'attr-8', key: 'institution_logo', label: 'Logo', active: false, placeholder: '[Logo]' },
];

// Default fonts available
export const AVAILABLE_FONTS = [
  { name: 'Inter', value: "'Inter', sans-serif" },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Poppins', value: "'Poppins', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Playfair Display', value: "'Playfair Display', serif" },
  { name: 'Raleway', value: "'Raleway', sans-serif" },
  { name: 'Oswald', value: "'Oswald', sans-serif" },
  { name: 'Lato', value: "'Lato', sans-serif" },
  { name: 'Monospace', value: "'Courier New', monospace" },
];

// Background presets
export const BACKGROUND_PRESETS: CardBackground[] = [
  { type: 'gradient', gradientStart: '#1e293b', gradientEnd: '#0f172a', gradientAngle: 145 },
  { type: 'gradient', gradientStart: '#1e1b4b', gradientEnd: '#312e81', gradientAngle: 135 },
  { type: 'gradient', gradientStart: '#0c4a6e', gradientEnd: '#164e63', gradientAngle: 135 },
  { type: 'gradient', gradientStart: '#14532d', gradientEnd: '#064e3b', gradientAngle: 135 },
  { type: 'gradient', gradientStart: '#7f1d1d', gradientEnd: '#450a0a', gradientAngle: 135 },
  { type: 'gradient', gradientStart: '#4c1d95', gradientEnd: '#5b21b6', gradientAngle: 135 },
  { type: 'gradient', gradientStart: '#1e3a5f', gradientEnd: '#0a1628', gradientAngle: 160 },
  { type: 'gradient', gradientStart: '#ffffff', gradientEnd: '#f1f5f9', gradientAngle: 180 },
  { type: 'solid', color: '#0f172a' },
  { type: 'solid', color: '#1e293b' },
  { type: 'solid', color: '#ffffff' },
  { type: 'solid', color: '#020617' },
];

// Generate unique ID
export function generateElementId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
