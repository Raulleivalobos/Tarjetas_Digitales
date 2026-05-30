// =====================================================
// Diccionario de Comunas de Chile — Coordenadas GIS
// Fase 1: Región Metropolitana (52 comunas)
// =====================================================

export interface ComunaGeoData {
  name: string;
  region: string;
  lat: number;
  lng: number;
  zoom: number;
  province: string;
}

// Lookup normalizado: key = nombre comuna en minúsculas sin tildes
export const COMUNAS_CHILE: Record<string, ComunaGeoData> = {
  // =====================================================
  // Provincia de Santiago (32 comunas)
  // =====================================================
  'santiago': { name: 'Santiago', region: 'Metropolitana', province: 'Santiago', lat: -33.4489, lng: -70.6693, zoom: 14 },
  'cerrillos': { name: 'Cerrillos', region: 'Metropolitana', province: 'Santiago', lat: -33.4958, lng: -70.7122, zoom: 14 },
  'cerro navia': { name: 'Cerro Navia', region: 'Metropolitana', province: 'Santiago', lat: -33.4225, lng: -70.7322, zoom: 14 },
  'conchali': { name: 'Conchalí', region: 'Metropolitana', province: 'Santiago', lat: -33.3833, lng: -70.6744, zoom: 14 },
  'el bosque': { name: 'El Bosque', region: 'Metropolitana', province: 'Santiago', lat: -33.5631, lng: -70.6744, zoom: 14 },
  'estacion central': { name: 'Estación Central', region: 'Metropolitana', province: 'Santiago', lat: -33.4517, lng: -70.7019, zoom: 14 },
  'huechuraba': { name: 'Huechuraba', region: 'Metropolitana', province: 'Santiago', lat: -33.3644, lng: -70.6344, zoom: 14 },
  'independencia': { name: 'Independencia', region: 'Metropolitana', province: 'Santiago', lat: -33.4167, lng: -70.6667, zoom: 15 },
  'la cisterna': { name: 'La Cisterna', region: 'Metropolitana', province: 'Santiago', lat: -33.5292, lng: -70.6600, zoom: 15 },
  'la florida': { name: 'La Florida', region: 'Metropolitana', province: 'Santiago', lat: -33.5228, lng: -70.5883, zoom: 13 },
  'la granja': { name: 'La Granja', region: 'Metropolitana', province: 'Santiago', lat: -33.5369, lng: -70.6219, zoom: 14 },
  'la pintana': { name: 'La Pintana', region: 'Metropolitana', province: 'Santiago', lat: -33.5833, lng: -70.6333, zoom: 14 },
  'la reina': { name: 'La Reina', region: 'Metropolitana', province: 'Santiago', lat: -33.4500, lng: -70.5500, zoom: 14 },
  'las condes': { name: 'Las Condes', region: 'Metropolitana', province: 'Santiago', lat: -33.4167, lng: -70.5833, zoom: 13 },
  'lo barnechea': { name: 'Lo Barnechea', region: 'Metropolitana', province: 'Santiago', lat: -33.3500, lng: -70.5167, zoom: 12 },
  'lo espejo': { name: 'Lo Espejo', region: 'Metropolitana', province: 'Santiago', lat: -33.5167, lng: -70.6917, zoom: 15 },
  'lo prado': { name: 'Lo Prado', region: 'Metropolitana', province: 'Santiago', lat: -33.4442, lng: -70.7264, zoom: 15 },
  'macul': { name: 'Macul', region: 'Metropolitana', province: 'Santiago', lat: -33.4889, lng: -70.5992, zoom: 14 },
  'maipu': { name: 'Maipú', region: 'Metropolitana', province: 'Santiago', lat: -33.5167, lng: -70.7667, zoom: 13 },
  'nunoa': { name: 'Ñuñoa', region: 'Metropolitana', province: 'Santiago', lat: -33.4569, lng: -70.5975, zoom: 14 },
  'pedro aguirre cerda': { name: 'Pedro Aguirre Cerda', region: 'Metropolitana', province: 'Santiago', lat: -33.4917, lng: -70.6750, zoom: 15 },
  'penalolen': { name: 'Peñalolén', region: 'Metropolitana', province: 'Santiago', lat: -33.4833, lng: -70.5333, zoom: 13 },
  'providencia': { name: 'Providencia', region: 'Metropolitana', province: 'Santiago', lat: -33.4333, lng: -70.6167, zoom: 14 },
  'pudahuel': { name: 'Pudahuel', region: 'Metropolitana', province: 'Santiago', lat: -33.4333, lng: -70.7500, zoom: 13 },
  'quilicura': { name: 'Quilicura', region: 'Metropolitana', province: 'Santiago', lat: -33.3500, lng: -70.7333, zoom: 13 },
  'quinta normal': { name: 'Quinta Normal', region: 'Metropolitana', province: 'Santiago', lat: -33.4167, lng: -70.7000, zoom: 15 },
  'recoleta': { name: 'Recoleta', region: 'Metropolitana', province: 'Santiago', lat: -33.4000, lng: -70.6333, zoom: 14 },
  'renca': { name: 'Renca', region: 'Metropolitana', province: 'Santiago', lat: -33.3833, lng: -70.7167, zoom: 14 },
  'san joaquin': { name: 'San Joaquín', region: 'Metropolitana', province: 'Santiago', lat: -33.4969, lng: -70.6306, zoom: 15 },
  'san miguel': { name: 'San Miguel', region: 'Metropolitana', province: 'Santiago', lat: -33.4986, lng: -70.6531, zoom: 15 },
  'san ramon': { name: 'San Ramón', region: 'Metropolitana', province: 'Santiago', lat: -33.5333, lng: -70.6444, zoom: 15 },
  'vitacura': { name: 'Vitacura', region: 'Metropolitana', province: 'Santiago', lat: -33.3833, lng: -70.5667, zoom: 14 },

  // =====================================================
  // Provincia de Cordillera (3 comunas)
  // =====================================================
  'puente alto': { name: 'Puente Alto', region: 'Metropolitana', province: 'Cordillera', lat: -33.6167, lng: -70.5750, zoom: 13 },
  'pirque': { name: 'Pirque', region: 'Metropolitana', province: 'Cordillera', lat: -33.7333, lng: -70.5833, zoom: 12 },
  'san jose de maipo': { name: 'San José de Maipo', region: 'Metropolitana', province: 'Cordillera', lat: -33.6333, lng: -70.3500, zoom: 11 },

  // =====================================================
  // Provincia de Chacabuco (3 comunas)
  // =====================================================
  'colina': { name: 'Colina', region: 'Metropolitana', province: 'Chacabuco', lat: -33.2000, lng: -70.6667, zoom: 12 },
  'lampa': { name: 'Lampa', region: 'Metropolitana', province: 'Chacabuco', lat: -33.2833, lng: -70.8667, zoom: 12 },
  'tiltil': { name: 'Tiltil', region: 'Metropolitana', province: 'Chacabuco', lat: -33.0833, lng: -70.9333, zoom: 12 },

  // =====================================================
  // Provincia de Maipo (4 comunas)
  // =====================================================
  'san bernardo': { name: 'San Bernardo', region: 'Metropolitana', province: 'Maipo', lat: -33.5917, lng: -70.7000, zoom: 13 },
  'buin': { name: 'Buin', region: 'Metropolitana', province: 'Maipo', lat: -33.7333, lng: -70.7333, zoom: 13 },
  'calera de tango': { name: 'Calera de Tango', region: 'Metropolitana', province: 'Maipo', lat: -33.6333, lng: -70.7667, zoom: 13 },
  'paine': { name: 'Paine', region: 'Metropolitana', province: 'Maipo', lat: -33.8167, lng: -70.7333, zoom: 12 },

  // =====================================================
  // Provincia de Melipilla (5 comunas)
  // =====================================================
  'melipilla': { name: 'Melipilla', region: 'Metropolitana', province: 'Melipilla', lat: -33.6833, lng: -71.2167, zoom: 12 },
  'alhue': { name: 'Alhué', region: 'Metropolitana', province: 'Melipilla', lat: -34.0333, lng: -71.1000, zoom: 12 },
  'curacavi': { name: 'Curacaví', region: 'Metropolitana', province: 'Melipilla', lat: -33.4000, lng: -71.1333, zoom: 13 },
  'maria pinto': { name: 'María Pinto', region: 'Metropolitana', province: 'Melipilla', lat: -33.5167, lng: -71.1167, zoom: 12 },
  'san pedro': { name: 'San Pedro', region: 'Metropolitana', province: 'Melipilla', lat: -33.8833, lng: -71.4500, zoom: 12 },

  // =====================================================
  // Provincia de Talagante (5 comunas)
  // =====================================================
  'talagante': { name: 'Talagante', region: 'Metropolitana', province: 'Talagante', lat: -33.6667, lng: -70.9333, zoom: 13 },
  'el monte': { name: 'El Monte', region: 'Metropolitana', province: 'Talagante', lat: -33.6833, lng: -71.0167, zoom: 13 },
  'isla de maipo': { name: 'Isla de Maipo', region: 'Metropolitana', province: 'Talagante', lat: -33.7500, lng: -70.9000, zoom: 13 },
  'padre hurtado': { name: 'Padre Hurtado', region: 'Metropolitana', province: 'Talagante', lat: -33.5667, lng: -70.8333, zoom: 13 },
  'penaflor': { name: 'Peñaflor', region: 'Metropolitana', province: 'Talagante', lat: -33.6167, lng: -70.8833, zoom: 13 },
};

/**
 * Normaliza texto para lookup: minúsculas, sin tildes, sin caracteres especiales
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .trim();
}

/**
 * Busca una comuna por nombre (tolerante a tildes y mayúsculas)
 */
export function findComuna(communeName: string | null | undefined): ComunaGeoData | null {
  if (!communeName) return null;
  
  const normalized = normalizeText(communeName);
  
  // Lookup directo
  if (COMUNAS_CHILE[normalized]) {
    return COMUNAS_CHILE[normalized];
  }
  
  // Búsqueda parcial (para nombres como "Municipalidad de Santiago")
  const keys = Object.keys(COMUNAS_CHILE);
  const match = keys.find(key => normalized.includes(key) || key.includes(normalized));
  
  return match ? COMUNAS_CHILE[match] : null;
}

/**
 * Genera coordenadas distribuidas dentro de una comuna
 * para posicionar JJVV sin coordenadas reales
 */
export function generateJJVVPositions(
  center: { lat: number; lng: number },
  count: number,
  spreadRadius: number = 0.015
): Array<{ lat: number; lng: number }> {
  if (count === 0) return [];
  if (count === 1) return [{ lat: center.lat, lng: center.lng }];

  const positions: Array<{ lat: number; lng: number }> = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Fibonacci spiral

  for (let i = 0; i < count; i++) {
    const r = spreadRadius * Math.sqrt((i + 0.5) / count);
    const theta = i * goldenAngle;
    positions.push({
      lat: center.lat + r * Math.cos(theta),
      lng: center.lng + r * Math.sin(theta) * 1.3, // stretch lng (latitude compensation)
    });
  }

  return positions;
}

/**
 * Retorna todas las comunas disponibles (para futuros selectores)
 */
export function getAllComunas(): ComunaGeoData[] {
  return Object.values(COMUNAS_CHILE);
}

/**
 * Retorna comunas filtradas por provincia
 */
export function getComunasByProvince(province: string): ComunaGeoData[] {
  return Object.values(COMUNAS_CHILE).filter(
    c => normalizeText(c.province) === normalizeText(province)
  );
}
