'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  TrendingUp,
  DollarSign,
  UserPlus,
  Calendar,
  FileDown,
  MessageCircle,
  Ban
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/lib/utils';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { Certificate, CertificateType } from '@/lib/types';
import { exportReportToPDF } from '@/lib/pdfGenerator';

export default function CertificatesPage() {
  const { organization, loading: authLoading, membership } = useAuth();
  const isReadOnly = ['viewer', 'auditor'].includes(membership?.role || '');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showReport, setShowReport] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAnnulModal, setShowAnnulModal] = useState<Certificate | null>(null);
  const [annulReason, setAnnulReason] = useState('');
  const [isAnnuling, setIsAnnuling] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchCertificates = useCallback(async () => {
    if (!organization) return;
    setLoading(true);
    setError('');

    try {
      let query = supabase
        .from('certificates')
        .select('*, beneficiaries(full_name, rut, phone)')
        .eq('org_id', organization.id)
        .order('issued_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Supabase error:', queryError);
        setError('Error al cargar certificados. Intenta de nuevo.');
      } else {
        setCertificates(data || []);
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, typeFilter]);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const reportData = certificates.map(c => ({
        folio: c.folio?.toString().padStart(6, '0') || '-',
        receptor: c.resident_data?.full_name || (c as any).beneficiaries?.full_name || 'Desconocido',
        tipo: c.status === 'annulled' ? '(ANULADO)' : (c.type === 'socio_activo' ? 'Socio Activo' : c.type === 'socio_inactivo' ? 'Socio Inactivo' : 'Residente'),
        costo: c.status === 'annulled' ? '$0' : `$${(c.cost || 0).toLocaleString('es-CL')}`,
        fecha: new Date(c.issued_at).toLocaleDateString('es-CL')
      }));

      const validCertificates = certificates.filter(c => c.status !== 'annulled');

      const footerSummary = [
        { 
          type: 'Socio Activo', 
          count: validCertificates.filter(c => c.type === 'socio_activo').length,
          total: validCertificates.filter(c => c.type === 'socio_activo').reduce((acc, c) => acc + (c.cost || 0), 0)
        },
        { 
          type: 'Socio Inactivo', 
          count: validCertificates.filter(c => c.type === 'socio_inactivo').length,
          total: validCertificates.filter(c => c.type === 'socio_inactivo').reduce((acc, c) => acc + (c.cost || 0), 0)
        },
        { 
          type: 'Residente', 
          count: validCertificates.filter(c => c.type === 'residente').length,
          total: validCertificates.filter(c => c.type === 'residente').reduce((acc, c) => acc + (c.cost || 0), 0)
        }
      ].filter(item => item.count > 0);

      await exportReportToPDF({
        filename: `Reporte_Certificados_${organization?.slug || 'export'}`,
        title: 'Reporte de Certificados Emitidos',
        subtitle: 'Desglose detallado por categoría y folio',
        orgName: organization?.name,
        logoUrl: organization?.logo_url || undefined,
        dateRange: dateRange.start || dateRange.end ? dateRange : undefined,
        summary: [
          { label: 'Total Emitidos', value: certificates.length.toString() },
          { label: 'Total Anulados', value: certificates.filter(c => c.status === 'annulled').length.toString() },
          { label: 'Socios Activos', value: certificates.filter(c => c.type === 'socio_activo' && c.status !== 'annulled').length.toString() },
          { label: 'Socios Inactivos', value: certificates.filter(c => c.type === 'socio_inactivo' && c.status !== 'annulled').length.toString() },
          { label: 'Residentes', value: certificates.filter(c => c.type === 'residente' && c.status !== 'annulled').length.toString() },
          { label: 'Recaudación Válida', value: `$${validCertificates.reduce((acc, curr) => acc + (curr.cost || 0), 0).toLocaleString('es-CL')}` }
        ],
        footerSummary,
        columns: [
          { header: 'Folio', key: 'folio', width: 12 },
          { header: 'Beneficiario / Residente', key: 'receptor', width: 40 },
          { header: 'Tipo', key: 'tipo', width: 18 },
          { header: 'Fecha Emisión', key: 'fecha', width: 15 },
          { header: 'Costo', key: 'costo', width: 15, align: 'right' }
        ],
        data: reportData
      });
    } catch (error) {
      console.error('Error generando reporte:', error);
    } finally {
      setGeneratingReport(false);
      setShowReport(false);
    }
  };

  const handleSendWhatsApp = (cert: Certificate) => {
    // Both active member and resident certificates might have phone numbers in different structures
    const phoneSource = (cert.resident_data as any)?.phone || (cert as any).beneficiaries?.phone;
    
    if (!phoneSource) {
      alert('El receptor no tiene un número de teléfono registrado.');
      return;
    }
    
    let phone = phoneSource.replace(/\D/g, '');
    if (phone.length === 8) phone = `569${phone}`;
    if (phone.length === 9 && phone.startsWith('9')) phone = `56${phone}`;
    
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/validate/cert/${cert.id}`;
    
    const fullName = cert.resident_data?.full_name || (cert as any).beneficiaries?.full_name || 'Vecino(a)';
    const firstName = fullName.split(' ')[0];
    const orgName = organization?.name || 'nuestra organización';
    
    const typeLabel = cert.type === 'socio_activo' || cert.type === 'socio_inactivo' 
      ? 'Certificado de Socio' 
      : 'Certificado de Residencia';

    const message = `¡Hola ${firstName}! 📄 Tu ${typeLabel} de ${orgName} ya está disponible. Puedes visualizarlo y descargarlo en el siguiente enlace oficial: ${url}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleRequestAnnulment = async () => {
    if (!showAnnulModal || !annulReason.trim() || !organization) return;
    
    setIsAnnuling(true);
    const cert = showAnnulModal;
    
    try {
      let token: string;
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        token = crypto.randomUUID();
      } else {
        token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      const { data, error: updateError } = await supabase
        .from('certificates')
        .update({ 
          status: 'pending_annulment', 
          annulment_reason: annulReason,
          annulment_token: token
        })
        .eq('id', cert.id)
        .select();
        
      if (updateError) throw updateError;
      
      if (!data || data.length === 0) {
        throw new Error("No se pudo actualizar el certificado. Posible bloqueo de permisos (RLS) en la base de datos, o la columna 'status' no permite 'pending_annulment'.");
      }
      
      setCertificates(prev => prev.map(c => c.id === cert.id ? { ...c, status: 'pending_annulment' as any, annulment_reason: annulReason, annulment_token: token } : c));
      
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/validate/anular/${token}`;
      const message = `Hola Presidente(a). Se solicita anular el certificado #${cert.folio || ''}. Motivo: ${annulReason}. Para autorizar la anulación inmediatamente, haz clic aquí: ${url}`;
      
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
      
      setShowAnnulModal(null);
      setAnnulReason('');
    } catch (err: any) {
      console.error('Error requesting annulment', err);
      alert(`Error al solicitar anulación: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsAnnuling(false);
    }
  };

  useEffect(() => {
    if (organization) {
      fetchCertificates();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [organization, authLoading, fetchCertificates]);

  const filteredCertificates = certificates.filter(c => {
    const searchLower = search.toLowerCase();
    const name = c.resident_data?.full_name || (c as any).beneficiaries?.full_name || '';
    const rut = c.resident_data?.rut || (c as any).beneficiaries?.rut || '';
    return name.toLowerCase().includes(searchLower) || rut.includes(searchLower) || (c.folio && c.folio.toString().includes(searchLower));
  });

  if (loading) return <PageSkeleton />;

  // Error state with retry
  if (error && certificates.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white">No se pudieron cargar los certificados</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <button 
          onClick={fetchCertificates}
          className="btn-primary px-6 py-2.5 text-sm font-bold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Certificados de Residencia</h1>
          <p className="text-slate-400 mt-1 text-sm">Gestiona y emite certificados oficiales para socios y residentes.</p>
        </div>
        {!isReadOnly && (
          <Link 
            href="/dashboard/certificates/issue" 
            className="btn-primary px-5 py-2.5 flex items-center justify-center gap-2 text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            Emitir Certificado
          </Link>
        )}
        <button 
          onClick={() => setShowReport(true)}
          className="btn-ghost px-5 py-2.5 flex items-center justify-center gap-2 text-sm font-bold border border-white/10"
        >
          <FileDown className="w-4 h-4" />
          Generar Reporte
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <div className="glass-card p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Emitidos</p>
              <p className="text-xl font-bold text-white">{certificates.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Nulos</p>
              <p className="text-xl font-bold text-white">
                {certificates.filter(c => c.status === 'annulled').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Socios Activos</p>
              <p className="text-xl font-bold text-white">
                {certificates.filter(c => c.type === 'socio_activo').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Socios Inactivos</p>
              <p className="text-xl font-bold text-white">
                {certificates.filter(c => c.type === 'socio_inactivo').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Residentes</p>
              <p className="text-xl font-bold text-white">
                {certificates.filter(c => c.type === 'residente').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Vigentes</p>
              <p className="text-xl font-bold text-white">
                {certificates.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Recaudación</p>
              <p className="text-xl font-bold text-white">
                ${certificates.filter(c => c.status !== 'annulled').reduce((acc, curr) => acc + (curr.cost || 0), 0).toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/30">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o folio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="glass-input text-sm px-3 py-2 outline-none"
            >
              <option value="all">Todos los tipos</option>
              <option value="socio_activo">Socio Activo</option>
              <option value="socio_inactivo">Socio Inactivo</option>
              <option value="residente">Residente</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-slate-400">
                <th className="px-6 py-4 font-medium">Folio</th>
                <th className="px-6 py-4 font-medium">Socio / Residente</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Fecha Emisión</th>
                <th className="px-6 py-4 font-medium">Costo</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCertificates.length > 0 ? (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-brand-400 font-bold">#{cert.folio}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">
                          {cert.resident_data?.full_name || (cert as any).beneficiaries?.full_name || 'Desconocido'}
                        </p>
                        <p className="text-slate-500 text-xs font-mono">
                          {cert.resident_data?.rut || (cert as any).beneficiaries?.rut || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        cert.type === 'socio_activo' ? 'bg-emerald-500/10 text-emerald-400' :
                        cert.type === 'socio_inactivo' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {cert.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {formatDateTime(cert.issued_at)}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      ${(cert.cost || 0).toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={cert.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cert.status === 'active' && (
                          <button
                            onClick={() => setShowAnnulModal(cert)}
                            title="Solicitar Anulación"
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleSendWhatsApp(cert)}
                          title="Enviar por WhatsApp"
                          className="p-2 text-slate-400 hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <Link 
                          href={`/dashboard/certificates/${cert.id}`}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" 
                          title="Ver Certificado"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link 
                          href={`/dashboard/certificates/${cert.id}`}
                          className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors" 
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>No se encontraron certificados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 md:pt-24 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="glass-card w-full max-w-lg p-6 space-y-6 animate-in slide-in-from-top-8 duration-300 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileDown className="w-5 h-5 text-brand-400" />
                Reporte de Recaudación
              </h2>
              <button onClick={() => setShowReport(false)} className="text-slate-500 hover:text-white">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fecha Desde</label>
                  <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="glass-input w-full px-3 py-2 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fecha Hasta</label>
                  <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="glass-input w-full px-3 py-2 text-sm" 
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 space-y-3">
                <p className="text-xs text-brand-300 font-bold uppercase tracking-widest">Resumen Preliminar</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Certificados Emitidos:</span>
                  <span className="text-white font-bold">{certificates.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Recaudado:</span>
                  <span className="text-emerald-400 font-black">${certificates.filter(c => c.status !== 'annulled').reduce((acc, curr) => acc + (curr.cost || 0), 0).toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <p className="text-[10px] text-blue-300/80 leading-tight">
                  Este reporte generará un documento PDF con el desglose de certificados por tipo, folio y fecha, listo para la firma de Tesorería y Presidencia.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowReport(false)}
                className="flex-1 btn-ghost py-2.5 text-sm font-bold border border-white/5"
              >
                Cancelar
              </button>
              <button 
                disabled={generatingReport}
                className="flex-1 btn-primary py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleGenerateReport}
              >
                {generatingReport ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
                ) : (
                  <><Download className="w-4 h-4" /> Descargar Reporte</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Annulment Modal */}
      <Modal
        isOpen={!!showAnnulModal}
        onClose={() => {
          if (!isAnnuling) {
            setShowAnnulModal(null);
            setAnnulReason('');
          }
        }}
        title="Solicitar Anulación de Certificado"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm mb-6">
            Estás a punto de solicitar la anulación del certificado <strong className="text-white">#{showAnnulModal?.folio || ''}</strong>. 
            Ingresa el motivo. Se abrirá WhatsApp para enviar un enlace de autorización al Presidente(a).
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Motivo de la anulación</label>
            <textarea
              value={annulReason}
              onChange={(e) => setAnnulReason(e.target.value)}
              placeholder="Ej: Error en el nombre, cobro indebido, etc."
              className="glass-input w-full px-4 py-3 text-sm min-h-[100px] resize-none"
              disabled={isAnnuling}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowAnnulModal(null);
                setAnnulReason('');
              }}
              disabled={isAnnuling}
              className="flex-1 btn-ghost py-2.5 text-sm font-bold border border-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleRequestAnnulment}
              disabled={!annulReason.trim() || isAnnuling}
              className="flex-1 btn-danger py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnnuling ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</>
              ) : (
                <><Ban className="w-4 h-4" /> Solicitar Anulación</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
