import { type ClassValue, clsx } from 'clsx';

// Simple clsx-like utility (avoiding extra dependency)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Chilean RUT validation
export function validateRut(rut: string): boolean {
  if (!rut || rut.length < 3) return false;
  
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  if (cleanRut.length < 2) return false;
  
  const body = cleanRut.slice(0, -1);
  const verifier = cleanRut.slice(-1).toUpperCase();
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const computed = remainder === 0 ? '0' : remainder === 1 ? 'K' : String(11 - remainder);
  
  return computed === verifier;
}

// Format RUT for display
export function formatRut(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return clean;
  
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1);
  
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${verifier}`;
}

// Generate unique card number
export function generateCardNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CS-${timestamp}-${random}`;
}

// Generate QR code data
export function generateQRData(cardId: string, orgSlug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/validate/${orgSlug}/${cardId}`;
  }
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/validate/${orgSlug}/${cardId}`;
}

// Format date
export function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

// Format date with time
export function formatDateTime(date: string | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Status color mapping
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    blocked: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    revoked: 'bg-red-500/10 text-red-400 border-red-500/20',
    pending: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    draft: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    used: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    exhausted: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return colors[status] || colors.inactive;
}

// Status label mapping (Spanish)
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    blocked: 'Bloqueado',
    expired: 'Caducado',
    revoked: 'Revocado',
    pending: 'Pendiente',
    draft: 'Borrador',
    used: 'Usado',
    cancelled: 'Cancelado',
    exhausted: 'Agotado',
  };
  return labels[status] || status;
}

// Benefit type label mapping
export function getBenefitTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    subsidy: 'Subsidio',
    bonus: 'Bonificación',
    aid: 'Ayuda',
    other: 'Otro',
  };
  return labels[type] || type;
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
