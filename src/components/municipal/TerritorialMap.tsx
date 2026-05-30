'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { findComuna, generateJJVVPositions } from '@/data/comunas-chile';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  MapPin,
  Layers,
  Maximize2,
  Minimize2,
} from 'lucide-react';

// Fix Leaflet default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

// =====================================================
// Types
// =====================================================

export interface JJVVMapData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  commune?: string | null;
  beneficiaryCount: number;
  cardCount: number;
  lat?: number;
  lng?: number;
}

interface TerritorialMapProps {
  communeName: string | null | undefined;
  jjvvList: JJVVMapData[];
  municipalityName?: string;
}

// =====================================================
// Custom marker icon
// =====================================================

function createCustomIcon(isActive: boolean, size: 'sm' | 'md' | 'lg' = 'md') {
  const sizes = { sm: 28, md: 36, lg: 44 };
  const s = sizes[size];
  const color = isActive ? '#6366f1' : '#475569';
  const glowColor = isActive ? 'rgba(99, 102, 241, 0.4)' : 'rgba(71, 85, 105, 0.2)';

  return L.divIcon({
    className: 'custom-jjvv-marker',
    html: `
      <div style="
        width: ${s}px; height: ${s}px;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 16px ${glowColor}, 0 4px 12px rgba(0,0,0,0.5);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
      ">
        <svg width="${s * 0.45}" height="${s * 0.45}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        ${isActive ? `<div style="
          position: absolute; inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(99, 102, 241, 0.3);
          animation: marker-pulse 2.5s ease-in-out infinite;
        "></div>` : ''}
      </div>
    `,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    popupAnchor: [0, -s / 2 - 4],
  });
}

// =====================================================
// MapController — moves map when commune changes
// =====================================================

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);

  return null;
}

// =====================================================
// Main Component
// =====================================================

export default function TerritorialMap({ communeName, jjvvList, municipalityName }: TerritorialMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'street' | 'satellite'>('street');
  const [selectedJJVV, setSelectedJJVV] = useState<string | null>(null);

  // Resolve commune coordinates
  const comunaData = findComuna(communeName);
  const center: [number, number] = comunaData
    ? [comunaData.lat, comunaData.lng]
    : [-33.4489, -70.6693]; // Default: Santiago
  const zoom = comunaData?.zoom || 13;

  // Generate positions for JJVV within the commune
  const positions = generateJJVVPositions(
    { lat: center[0], lng: center[1] },
    jjvvList.length,
    zoom >= 14 ? 0.012 : 0.02
  );

  // Merge positions with JJVV data
  const markersData = jjvvList.map((jjvv, idx) => ({
    ...jjvv,
    position: positions[idx] || { lat: center[0], lng: center[1] },
  }));

  // Tile layers
  const tileLayers = {
    street: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    },
  };

  const currentTile = tileLayers[activeLayer];

  // Calculate total stats
  const totalBeneficiaries = jjvvList.reduce((sum, j) => sum + j.beneficiaryCount, 0);
  const totalCards = jjvvList.reduce((sum, j) => sum + j.cardCount, 0);

  return (
    <div
      className={`glass-card-solid overflow-hidden transition-all duration-500 ${
        isExpanded ? 'fixed inset-4 z-50' : 'relative'
      }`}
    >
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-5 py-3 bg-gradient-to-b from-[rgba(11,15,26,0.95)] to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/15 backdrop-blur-sm">
            <MapPin className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">
              Mapa Territorial
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              {comunaData?.name || communeName || 'Sin comuna'} · {comunaData?.region || 'RM'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats badges */}
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Building2 className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300">{jjvvList.length}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Users className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-300">{totalBeneficiaries}</span>
            </div>
          </div>

          {/* Layer toggle */}
          <button
            onClick={() => setActiveLayer(l => l === 'street' ? 'satellite' : 'street')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            title="Cambiar capa"
          >
            <Layers className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </button>

          {/* Expand toggle */}
          <button
            onClick={() => setIsExpanded(e => !e)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            title={isExpanded ? 'Minimizar' : 'Pantalla completa'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1]"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Map container */}
      <div className={`w-full ${isExpanded ? 'h-full' : 'h-[420px]'} transition-all duration-500`}>
        <MapContainer
          center={center}
          zoom={zoom}
          className="w-full h-full"
          zoomControl={false}
          attributionControl={false}
          style={{ background: '#0b0f1a' }}
        >
          <MapController center={center} zoom={zoom} />

          <TileLayer url={currentTile.url} attribution={currentTile.attribution} />

          {/* Comuna boundary circle indicator */}
          <Circle
            center={center}
            radius={zoom >= 14 ? 1500 : 2500}
            pathOptions={{
              color: 'rgba(99, 102, 241, 0.25)',
              fillColor: 'rgba(99, 102, 241, 0.05)',
              fillOpacity: 0.3,
              weight: 1,
              dashArray: '8 6',
            }}
          />

          {/* JJVV Markers */}
          {markersData.map((jjvv) => {
            const isActive = jjvv.beneficiaryCount > 0;
            const markerSize = jjvv.beneficiaryCount > 50 ? 'lg' : jjvv.beneficiaryCount > 10 ? 'md' : 'sm';

            return (
              <Marker
                key={jjvv.id}
                position={[jjvv.position.lat, jjvv.position.lng]}
                icon={createCustomIcon(isActive, markerSize)}
                eventHandlers={{
                  click: () => setSelectedJJVV(jjvv.id),
                }}
              >
                <Popup className="leaflet-popup-custom" maxWidth={280} minWidth={240}>
                  <div className="p-0">
                    {/* Popup header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {jjvv.logo_url ? (
                          <img src={jjvv.logo_url} className="w-full h-full object-contain" alt={jjvv.name} />
                        ) : (
                          <Building2 className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm leading-tight truncate">{jjvv.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">/{jjvv.slug}</p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className="w-3 h-3 text-emerald-400" />
                          <span className="text-[9px] text-slate-500 uppercase font-bold">Vecinos</span>
                        </div>
                        <p className="text-lg font-black text-white">{jjvv.beneficiaryCount}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CreditCard className="w-3 h-3 text-blue-400" />
                          <span className="text-[9px] text-slate-500 uppercase font-bold">Tarjetas</span>
                        </div>
                        <p className="text-lg font-black text-white">{jjvv.cardCount}</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}>
                        {isActive ? 'Activa' : 'Sin actividad'}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {new Date(jjvv.created_at).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Heatmap circles for density */}
          {markersData.map((jjvv) => (
            <CircleMarker
              key={`heat-${jjvv.id}`}
              center={[jjvv.position.lat, jjvv.position.lng]}
              radius={Math.min(Math.max(jjvv.beneficiaryCount * 0.8, 8), 40)}
              pathOptions={{
                color: 'transparent',
                fillColor: jjvv.beneficiaryCount > 20 ? '#10b981' : jjvv.beneficiaryCount > 5 ? '#6366f1' : '#475569',
                fillOpacity: 0.15,
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Bottom legend */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] px-5 py-3 bg-gradient-to-t from-[rgba(11,15,26,0.95)] to-transparent">
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
            <span className="text-slate-400 font-medium">JJVV Activa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-600" />
            <span className="text-slate-400 font-medium">Sin actividad</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
            <span className="text-slate-400 font-medium">Alta adopción</span>
          </div>
          <div className="flex-1" />
          <span className="text-slate-600 font-mono">
            Leaflet + OpenStreetMap
          </span>
        </div>
      </div>
    </div>
  );
}
