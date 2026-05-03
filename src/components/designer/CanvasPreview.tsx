'use client';

import { CardDesign, TextElement, ImageElement, ShapeElement, QRElement } from '@/lib/cardDesignTypes';
import { useRef, useCallback, useState, useEffect, isValidElement, cloneElement } from 'react';
import { Move } from 'lucide-react';

interface CanvasPreviewProps {
  design: CardDesign;
  selectedElementId: string | null;
  onSelectElement?: (id: string | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateElement?: (id: string, updates: Record<string, any>) => void;
  scale?: number;
  readOnly?: boolean;
}

function getBackgroundStyle(design: CardDesign): React.CSSProperties {
  const bg = design.background;
  if (bg.type === 'solid') {
    return { background: bg.color || '#0f172a' };
  }
  if (bg.type === 'gradient') {
    return {
      background: `linear-gradient(${bg.gradientAngle || 135}deg, ${bg.gradientStart || '#1e293b'} 0%, ${bg.gradientEnd || '#0f172a'} 100%)`,
    };
  }
  if (bg.type === 'image') {
    return {
      background: `url(${bg.imageUrl}) center/cover no-repeat`,
      position: 'relative',
    };
  }
  return { background: '#0f172a' };
}

// ─────────────────────────────────────────────────────────────
// Resize handle types
// ─────────────────────────────────────────────────────────────
type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLE_CURSORS: Record<ResizeDirection, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  sw: 'nesw-resize',
};

// ─────────────────────────────────────────────────────────────
// Resize handles component
// ─────────────────────────────────────────────────────────────
function ResizeHandles({
  onResizeStart,
}: {
  onResizeStart: (dir: ResizeDirection, e: React.PointerEvent) => void;
}) {
  const handleSize = 10;
  const halfHandle = handleSize / 2;
  const hitAreaSize = 30; // Increased to 30px for much easier grabbing
  const halfHitArea = hitAreaSize / 2;

  const handles: { dir: ResizeDirection; style: React.CSSProperties }[] = [
    // Corners
    { dir: 'nw', style: { top: 0, left: 0 } },
    { dir: 'ne', style: { top: 0, left: '100%' } },
    { dir: 'sw', style: { top: '100%', left: 0 } },
    { dir: 'se', style: { top: '100%', left: '100%' } },
    // Edges
    { dir: 'n', style: { top: 0, left: '50%' } },
    { dir: 's', style: { top: '100%', left: '50%' } },
    { dir: 'w', style: { top: '50%', left: 0 } },
    { dir: 'e', style: { top: '50%', left: '100%' } },
  ];

  return (
    <>
      {handles.map(({ dir, style }) => (
        <div
          key={dir}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // Capture pointer so it continues to fire events even if mouse leaves the handle area
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            onResizeStart(dir, e);
          }}
          className="absolute z-50 flex items-center justify-center pointer-events-auto"
          style={{
            ...style,
            width: hitAreaSize,
            height: hitAreaSize,
            marginTop: -halfHitArea,
            marginLeft: -halfHitArea,
            cursor: HANDLE_CURSORS[dir],
          }}
        >
          <div
            className={`rounded-sm shadow-xl transition-transform hover:scale-125 ${dir.length === 2 ? 'bg-white' : 'bg-brand-400'}`}
            style={{
              width: handleSize,
              height: handleSize,
              border: dir.length === 2 ? '1px solid #6366f1' : '1px solid #ffffff',
            }}
          />
        </div>
      ))}
      {/* Blueprint-style corner markers */}
      <div className="absolute -inset-[2px] pointer-events-none border border-brand-400/60 rounded-[2px] shadow-[0_0_15px_rgba(99,102,241,0.2)]" />
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-brand-400 -mt-[3px] -ml-[3px]" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-brand-400 -mt-[3px] -mr-[3px]" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-brand-400 -mb-[3px] -ml-[3px]" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-brand-400 -mb-[3px] -mr-[3px]" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Interactive element wrapper: drag (Ctrl) + resize (handles)
// ─────────────────────────────────────────────────────────────
function InteractiveElement({
  id,
  x,
  y,
  widthPct,
  heightPct,
  isSelected,
  isBackground,
  zIndex,
  onClick,
  onUpdate,
  canvasRef,
  scale,
  children,
  className,
  style,
  resizable,
  sizeKey,
  isText,
  readOnly,
}: {
  id: string;
  x: number;
  y: number;
  widthPct?: number;
  heightPct?: number | string;
  isSelected: boolean;
  isBackground: boolean;
  zIndex: number;
  onClick: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (id: string, updates: Record<string, any>) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  resizable?: boolean;
  sizeKey?: 'size'; // for QR elements that use 'size' instead of 'width'
  isText?: boolean;
  readOnly?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<ResizeDirection | null>(null);
  const [isResizeMode, setIsResizeMode] = useState(false);
  const lastClickTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isSelected) {
      setIsResizeMode(false);
    }
  }, [isSelected]);

  // ── Drag (Click + move) ──
  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    onClick();
    
    // Custom robust double-click detection
    const now = Date.now();
    if (now - lastClickTimeRef.current < 400) {
      setIsResizeMode(true);
      lastClickTimeRef.current = 0; // reset
      return; // prevent dragging when entering resize mode
    }
    lastClickTimeRef.current = now;

    let hasMoved = false;
    const startX = x;
    const startY = y;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const onMove = (ev: PointerEvent) => {
      // Don't start dragging unless moved by at least 2 pixels
      if (!hasMoved) {
        if (Math.abs(ev.clientX - startMouseX) > 2 || Math.abs(ev.clientY - startMouseY) > 2) {
          hasMoved = true;
          setDragging(true);
        } else {
          return;
        }
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const deltaXPct = ((ev.clientX - startMouseX) / rect.width) * 100;
      const deltaYPct = ((ev.clientY - startMouseY) / rect.height) * 100;
      
      const newX = Math.max(0, Math.min(95, startX + deltaXPct));
      const newY = Math.max(0, Math.min(95, startY + deltaYPct));
      onUpdate(id, { x: round1(newX), y: round1(newY) });
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // ── Resize (handle drag) ──
  const handleResizeStart = (dir: ResizeDirection, e: React.PointerEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setResizing(dir);
    
    const startX = x;
    const startY = y;
    const startW = widthPct ?? 20;
    const startH = typeof heightPct === 'number' ? heightPct : 20;
    const startFontSize = (children as unknown as { props: { element?: { fontSize: number } } })?.props?.element?.fontSize || 16;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const onMove = (ev: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const deltaXPct = ((ev.clientX - startMouseX) / rect.width) * 100;
      const deltaYPct = ((ev.clientY - startMouseY) / rect.height) * 100;

      let newX = startX;
      let newY = startY;
      let newW = startW;
      let newH = startH;

      if (dir.includes('e')) newW = Math.max(3, startW + deltaXPct);
      if (dir.includes('w')) {
        newW = Math.max(3, startW - deltaXPct);
        newX = startX + deltaXPct;
        if (newX < 0) { newW += newX; newX = 0; }
      }

      if (dir.includes('s')) newH = Math.max(2, startH + deltaYPct);
      if (dir.includes('n')) {
        newH = Math.max(2, startH - deltaYPct);
        newY = startY + deltaYPct;
        if (newY < 0) { newH += newY; newY = 0; }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: Record<string, any> = {};
      
      if (dir.includes('w') || dir.includes('n')) {
        updates.x = round1(newX);
        updates.y = round1(newY);
      }

      if (sizeKey === 'size') {
        const delta = Math.abs(deltaXPct) > Math.abs(deltaYPct) ? deltaXPct : deltaYPct;
        const dirMultiplier = (dir.includes('e') || dir.includes('s')) ? 1 : -1;
        updates.size = Math.max(5, round1(startW + delta * dirMultiplier));
      } else {
        if (dir.includes('e') || dir.includes('w')) updates.width = Math.max(3, round1(newW));
        if (dir.includes('s') || dir.includes('n')) {
          if (typeof heightPct === 'number') updates.height = Math.max(2, round1(newH));
        }
      }

      const isCorner = dir.length === 2;
      if (isText && isCorner) {
        const ratio = newW / startW;
        updates.fontSize = Math.max(6, Math.min(120, Math.round(startFontSize * ratio)));
        updates.width = Math.max(3, round1(newW));
      }

      onUpdate(id, updates);
    };

    const onUp = () => {
      setResizing(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  void scale;

  const isActive = dragging || !!resizing;

  return (
    <div
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className={`absolute transition-all duration-150 ${
        dragging
          ? 'ring-2 ring-brand-400 shadow-[0_0_25px_rgba(99,102,241,0.4)] cursor-grabbing scale-[1.02] z-[100]'
          : resizing || isResizeMode
          ? 'ring-2 ring-brand-500/80 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
          : isSelected
          ? 'cursor-pointer ring-1 ring-brand-400/60 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
          : isBackground
          ? 'cursor-default'
          : 'hover:ring-1 hover:ring-brand-400/40 cursor-pointer'
      } ${className || ''}`}
      style={{
        ...style,
        left: `${x}%`,
        top: `${y}%`,
        zIndex,
        userSelect: 'none',
      }}
    >
      {children}

      {/* Resize handles only appear in Resize Mode after Double Click */}
      {isSelected && isResizeMode && resizable !== false && (
        <ResizeHandles onResizeStart={handleResizeStart} />
      )}
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─────────────────────────────────────────────────────────────
// Element body renderers
// ─────────────────────────────────────────────────────────────

function TextElementBody({ element, scale = 1 }: { element: TextElement; scale?: number }) {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    fontSize: `${Math.round(element.fontSize * scale)}px`,
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    color: element.color,
    textAlign: element.textAlign,
    transform: `rotate(${element.rotation}deg)`,
    opacity: element.opacity,
    letterSpacing: `${(element.letterSpacing || 0) * scale}px`,
    lineHeight: element.lineHeight || 1.2,
    padding: `${2 * scale}px ${4 * scale}px`,
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: element.textAlign === 'center' ? 'center' : 'center', // Default to center vertically
    alignItems: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
    overflow: 'hidden',
  };

  return (
    <div style={baseStyle} title={element.content}>
      {element.content}
    </div>
  );
}

function ImageElementBody({ element, scale = 1 }: { element: ImageElement; scale?: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: `rotate(${element.rotation}deg)`,
        opacity: element.opacity,
        overflow: 'hidden',
        borderRadius: `${element.borderRadius * scale}px`,
      }}
    >
      {element.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          key={element.src}
          src={element.src} 
          alt="" 
          className="w-full h-full object-cover" 
          draggable={false} 
          referrerPolicy="no-referrer"
          loading="eager"
          crossOrigin="anonymous"
        />
      ) : (
        <div className="w-full h-full bg-slate-700/50 flex items-center justify-center border border-dashed border-slate-500/50 rounded">
          <span className="text-xs text-slate-400" style={{ fontSize: `${12 * scale}px` }}>Imagen</span>
        </div>
      )}
    </div>
  );
}

function ShapeElementBody({ element, scale = 1 }: { element: ShapeElement; scale?: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: element.fill,
        border:
          element.strokeWidth > 0
            ? `${element.strokeWidth * scale}px solid ${element.stroke}`
            : 'none',
        borderRadius:
          element.type === 'circle' ? '50%' : `${element.borderRadius * scale}px`,
        transform: `rotate(${element.rotation}deg)`,
        opacity: element.opacity,
      }}
    />
  );
}

import { QRCodeDisplay } from '../ui/QRCodeDisplay';

function QRElementBody({ element, scale = 1, clickable = false }: { element: QRElement; scale?: number; clickable?: boolean }) {
  const content = (element as any).content;
  
  if (content) {
    const body = (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: element.background,
          borderRadius: `${((element as any).borderRadius || 0) * scale}px`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <QRCodeDisplay 
          data={content} 
          size={512} // High res internal, scaled by CSS
          className="w-full h-full"
          color={{
            dark: element.foreground,
            light: element.background === 'transparent' ? '#ffffff' : element.background
          }}
        />
      </div>
    );

    if (clickable && content.startsWith('http')) {
      return (
        <a 
          href={content} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {body}
        </a>
      );
    }

    return body;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: `${4 * scale}px`,
        background: element.background,
        borderRadius: `${(element.borderRadius || 8) * scale}px`,
      }}
    >
      <div
        className="w-full h-full grid grid-cols-5 grid-rows-5"
        style={{ color: element.foreground, gap: `${1 * scale}px` }}
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: `${1 * scale}px`,
              background: [0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 19, 20, 22, 23, 24].includes(i)
                ? element.foreground
                : 'transparent',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Z-index helper: background images stay at bottom, everything else above
// ─────────────────────────────────────────────────────────────
function isBackgroundImage(el: { type: string; data: ImageElement }): boolean {
  return (
    el.data.x === 0 &&
    el.data.y === 0 &&
    el.data.width >= 99 &&
    el.data.height >= 99
  );
}

// ─────────────────────────────────────────────────────────────
// Main CanvasPreview
// ─────────────────────────────────────────────────────────────

export function CanvasPreview({
  design,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  scale = 1,
  readOnly = false,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback(() => {
    onSelectElement?.(null);
  }, [onSelectElement]);

  return (
    <div className="flex items-center justify-center">
      <div
        ref={canvasRef}
        id="card-design-canvas"
        onClick={handleCanvasClick}
        className="relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-500"
        style={{
          width: `${design.width * scale}px`,
          height: `${design.height * scale}px`,
          ...getBackgroundStyle(design),
          borderRadius: '16px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          outline: '12px solid rgba(15, 23, 42, 0.5)',
        }}
      >
        {/* Background overlay for images */}
        {design.background.type === 'image' &&
          design.background.imageOpacity !== undefined && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'rgba(0,0,0,' +
                  (1 - (design.background.imageOpacity || 1)) +
                  ')',
                zIndex: 0,
              }}
            />
          )}

        {/* Render Elements — background images first (z:1), then others (z:10+) */}
        {design.elements.map((element, idx) => {
          const key = element.data.id;
          const isSelected = selectedElementId === key;

          // Hide elements linked to inactive attributes
          if ('isAttribute' in element.data && element.data.isAttribute) {
            const attr = design.attributes.find((a) => a.label === (element.data as TextElement | ImageElement).attributeKey);
            if (attr && !attr.active) {
              return null;
            }
          }

          switch (element.type) {
            case 'text': {
              const d = element.data as TextElement;
              // Text & attribute elements always render above everything
              return (
                <InteractiveElement
                  key={key}
                  id={key}
                  x={d.x}
                  y={d.y}
                  isSelected={isSelected}
                  isBackground={false}
                  zIndex={20 + idx}
                  onClick={() => onSelectElement?.(key)}
                  onUpdate={(id, updates) => onUpdateElement?.(id, updates)}
                  canvasRef={canvasRef}
                  scale={scale}
                  readOnly={readOnly}
                  resizable
                  isText
                  widthPct={d.width}
                  style={{
                    width: `${d.width}%`,
                  }}
                >
                  <TextElementBody element={d} scale={scale} />
                </InteractiveElement>
              );
            }
            case 'image': {
              const d = element.data as ImageElement;
              const isBg = isBackgroundImage({ type: 'image', data: d });
              return (
                <InteractiveElement
                  key={key}
                  id={key}
                  x={d.x}
                  y={d.y}
                  widthPct={d.width}
                  heightPct={d.height}
                  isSelected={isSelected}
                  isBackground={isBg}
                  zIndex={isBg ? 1 : 10 + idx}
                  onClick={() => onSelectElement?.(key)}
                  onUpdate={(id, updates) => onUpdateElement?.(id, updates)}
                  canvasRef={canvasRef}
                  scale={scale}
                  readOnly={readOnly}
                  resizable
                  style={{
                    width: `${d.width}%`,
                    height: `${d.height}%`,
                  }}
                >
                  <ImageElementBody element={d} scale={scale} />
                </InteractiveElement>
              );
            }
            case 'shape': {
              const d = element.data as ShapeElement;
              const isLine = d.type === 'line' || d.type === 'divider';
              return (
                <InteractiveElement
                  key={key}
                  id={key}
                  x={d.x}
                  y={d.y}
                  widthPct={d.width}
                  heightPct={isLine ? undefined : d.height}
                  isSelected={isSelected}
                  isBackground={false}
                  zIndex={10 + idx}
                  onClick={() => onSelectElement?.(key)}
                  onUpdate={(id, updates) => onUpdateElement?.(id, updates)}
                  canvasRef={canvasRef}
                  scale={scale}
                  readOnly={readOnly}
                  resizable
                  style={{
                    width: `${d.width}%`,
                    height: isLine ? `${2 * scale}px` : `${d.height}%`,
                  }}
                >
                  <ShapeElementBody element={d} scale={scale} />
                </InteractiveElement>
              );
            }
            case 'qr': {
              const d = element.data as QRElement;
              return (
                <InteractiveElement
                  key={key}
                  id={key}
                  x={d.x}
                  y={d.y}
                  widthPct={d.size}
                  heightPct={undefined} // Let aspect-ratio handle height
                  isSelected={isSelected}
                  isBackground={false}
                  zIndex={20 + idx}
                  onClick={() => onSelectElement?.(key)}
                  onUpdate={(id, updates) => onUpdateElement?.(id, updates)}
                  canvasRef={canvasRef}
                  scale={scale}
                  readOnly={readOnly}
                  resizable
                  sizeKey="size"
                  style={{ width: `${d.size}%`, aspectRatio: '1/1' }}
                >
                  <QRElementBody element={d} scale={scale} clickable={readOnly} />
                </InteractiveElement>
              );
            }
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
