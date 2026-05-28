'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Building2, Briefcase, Landmark, Users, ArrowRight,
  CheckCircle2, ChevronRight, RefreshCw, LogIn,
  Palette, Upload, QrCode, Check, Sparkles, User,
  FileSpreadsheet, Activity, ShieldAlert, ShieldCheck
} from 'lucide-react';

// Sectores configurados según requerimientos: Sindicatos, Bienestar, Municipios, Vecinos
const SECTORS = [
  {
    id: 'sindicatos',
    name: 'Sindicatos',
    icon: Building2,
    colorClass: 'text-amber-400',
    bgColorClass: 'bg-amber-500/10',
    borderColorClass: 'border-amber-500/25',
    gradientClass: 'from-amber-500/20 to-amber-600/5',
    cardTitle: 'Sindicato de Trabajadores Metalúrgicos',
    cardSubtitle: 'Credencial de Afiliado',
    cardFields: [
      { label: 'N° de Socio', value: 'S-4829' },
      { label: 'Planta / Div.', value: 'Planta Central' },
      { label: 'RUT', value: '15.678.901-2' },
    ],
    benefits: [
      'Acceso a asambleas con control de quórum y asistencia por QR.',
      'Control y entrega de beneficios sociales integrados.',
      'Sistema de reportería en PDF para asistencia.',
    ],
    adminPanelTitle: 'Panel de Control - Sindicato Metalúrgico',
    defaultColor: '#f59e0b', // Amber
  },
  {
    id: 'bienestar',
    name: 'Bienestar de Empresas',
    icon: Briefcase,
    colorClass: 'text-blue-400',
    bgColorClass: 'bg-blue-500/10',
    borderColorClass: 'border-blue-500/25',
    gradientClass: 'from-blue-500/20 to-blue-600/5',
    cardTitle: 'Bienestar Corporativo Apex',
    cardSubtitle: 'Credencial de Beneficiario',
    cardFields: [
      { label: 'Código Emp.', value: 'EMP-903' },
      { label: 'Plan de Salud', value: 'Plan Preferente Gold' },
      { label: 'RUT', value: '18.456.789-K' },
    ],
    benefits: [
      'Acceso a convenios deportivos y de salud sin copagos físicos.',
      'Asignación y cobro de aguinaldos con control de duplicidad.',
      'Reporte de uso de convenios en tiempo real para el departamento.',
    ],
    adminPanelTitle: 'Administración de Beneficios - Corporación Apex',
    defaultColor: '#3b82f6', // Blue
  },
  {
    id: 'municipios',
    name: 'Corporaciones Municipales',
    icon: Landmark,
    colorClass: 'text-indigo-400',
    bgColorClass: 'bg-indigo-500/10',
    borderColorClass: 'border-indigo-500/25',
    gradientClass: 'from-indigo-500/20 to-indigo-600/5',
    cardTitle: 'Ilustre Municipalidad San Carlos',
    cardSubtitle: 'Tarjeta Vecino Digital',
    cardFields: [
      { label: 'N° de Folio', value: 'V-09283' },
      { label: 'Comuna', value: 'San Carlos' },
      { label: 'RUT', value: '12.345.678-9' },
    ],
    benefits: [
      'Acceso gratuito a piscinas, talleres y recintos comunales.',
      'Retiro y control de subsidios de gas y alimentos en terreno.',
      'Identificación oficial alineada a Ley N° 21.180 (Cero Papel).',
    ],
    adminPanelTitle: 'Gestión Social y Vecinal - Municipalidad San Carlos',
    defaultColor: '#6366f1', // Indigo/Brand
  },
  {
    id: 'vecinos',
    name: 'Juntas de Vecinos',
    icon: Users,
    colorClass: 'text-emerald-400',
    bgColorClass: 'bg-emerald-500/10',
    borderColorClass: 'border-emerald-500/25',
    gradientClass: 'from-emerald-500/20 to-emerald-600/5',
    cardTitle: 'Junta de Vecinos Parque San Carlos',
    cardSubtitle: 'Miembro Activo',
    cardFields: [
      { label: 'N° Unidad', value: 'UV-24' },
      { label: 'Dirección', value: 'Pasaje Las Lilas 450' },
      { label: 'RUT', value: '16.123.456-7' },
    ],
    benefits: [
      'Credencial vecinal inteligente 100% gratuita para la junta.',
      'Verificación rápida de domicilio en asambleas y elecciones.',
      'Control seguro de subvenciones vecinales y eventos comunitarios.',
    ],
    adminPanelTitle: 'Portal del Socio - JV Parque San Carlos',
    defaultColor: '#10b981', // Emerald
  },
];

// Lista de beneficiarios de prueba para el simulador de carga
const INITIAL_BENEFICIARIES = [
  { name: 'Juan Pérez Muñoz', rut: '12.345.678-9', status: 'pending', id: '1' },
  { name: 'Ana Gómez Soto', rut: '15.678.901-2', status: 'pending', id: '2' },
  { name: 'Luis Rojas Valdés', rut: '18.456.789-K', status: 'pending', id: '3' },
];

function ComoFuncionaContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const [activeSector, setActiveSector] = useState(SECTORS[0]);

  useEffect(() => {
    if (tab) {
      const foundSector = SECTORS.find((s) => s.id === tab);
      if (foundSector) {
        setActiveSector(foundSector);
        setCardColor(foundSector.defaultColor);
      }
    }
  }, [tab]);
  const [activeStep, setActiveStep] = useState(1);
  
  // Paso 1 - Login state
  const [loginEmail, setLoginEmail] = useState('admin@organizacion.cl');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Paso 2 - Diseñador state
  const [cardColor, setCardColor] = useState(activeSector.defaultColor);
  const [showPhoto, setShowPhoto] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);

  // Paso 3 - Carga masiva state
  const [beneficiaries, setBeneficiaries] = useState(INITIAL_BENEFICIARIES);
  const [importStatus, setImportStatus] = useState('idle'); // idle | importing | done
  const [importProgress, setImportProgress] = useState(0);

  // Paso 4 - Validación QR state
  const [scannedUser, setScannedUser] = useState<typeof INITIAL_BENEFICIARIES[0] | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Sincronización de color y estados manejada directamente en la selección de sector


  // Manejar el submit de login ficticio
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      setIsLoggedIn(true);
      setActiveStep(2); // Avanzar automáticamente al paso 2
    }, 1200);
  };

  // Simular la carga masiva
  const handleStartImport = () => {
    setImportStatus('importing');
    setImportProgress(10);
    
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setImportStatus('done');
          // Actualizar estado de beneficiarios a "active"
          setBeneficiaries(prevList => prevList.map(b => ({ ...b, status: 'active' })));
          return 100;
        }
        return prev + 30;
      });
    }, 400);
  };

  // Simular escaneo de QR
  const handleScanUser = (user: typeof INITIAL_BENEFICIARIES[0]) => {
    setIsScanning(true);
    setScannedUser(null);
    setScanResult('idle');

    setTimeout(() => {
      setIsScanning(false);
      setScannedUser(user);
      setScanResult('valid');
    }, 1000);
  };

  // Reiniciar simulación completa
  const handleResetSimulator = () => {
    setIsLoggedIn(false);
    setActiveStep(1);
    setBeneficiaries(INITIAL_BENEFICIARIES);
    setImportStatus('idle');
    setImportProgress(0);
    setScannedUser(null);
    setScanResult('idle');
  };

  // Renderizar el contenido interactivo de la derecha del simulador según el paso activo
  const renderSimulatorVisual = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="w-full max-w-md mx-auto p-6 bg-surface-900 border border-brand-500/20 rounded-2xl shadow-xl animate-fade-in relative overflow-hidden">
            {/* Top design header */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-500 to-purple-600" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                <LogIn className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Panel de Administración</h4>
                <p className="text-[10px] text-slate-500">SkardKey Portal Seguro</p>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">¡Sesión Iniciada con éxito!</p>
                  <p className="text-xs text-slate-400 mt-1">Accediendo al panel de administración...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">Correo Electrónico</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="correo@organizacion.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">Contraseña</label>
                  <input
                    type="password"
                    value="••••••••••••"
                    disabled
                    className="w-full px-3 py-2 text-sm bg-surface-950/50 border border-white/5 rounded-xl text-slate-500 focus:outline-none cursor-not-allowed"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verificando Perfil...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-500">
                  Usa este botón simulador para ingresar a la plataforma.
                </p>
              </form>
            )}
          </div>
        );

      case 2:
        return (
          <div className="w-full grid md:grid-cols-2 gap-6 items-center animate-fade-in">
            {/* Controles de Diseño */}
            <div className="p-6 bg-surface-900 border border-white/10 rounded-2xl space-y-5">
              <div className="flex items-center gap-2 text-white">
                <Palette className="w-4 h-4 text-brand-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Editor del Carnet</h4>
              </div>

              {/* Selector de Color */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Color Institucional</label>
                <div className="flex gap-2.5">
                  {[
                    { hex: '#6366f1', label: 'Indigo' },
                    { hex: '#10b981', label: 'Esmeralda' },
                    { hex: '#f59e0b', label: 'Amber' },
                    { hex: '#ef4444', label: 'Rojo' },
                    { hex: '#3b82f6', label: 'Azul' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setCardColor(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${cardColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Toggles de diseño */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Mostrar foto de perfil</span>
                  <input
                    type="checkbox"
                    checked={showPhoto}
                    onChange={(e) => setShowPhoto(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface-950 border-white/10 text-brand-500 focus:ring-0 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Mostrar subtítulo</span>
                  <input
                    type="checkbox"
                    checked={showSubtitle}
                    onChange={(e) => setShowSubtitle(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface-950 border-white/10 text-brand-500 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={() => setActiveStep(3)}
                className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Guardar y Siguiente Paso</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Vista Previa de Credencial */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Vista previa en tiempo real</span>
              <div
                className="w-full max-w-[340px] aspect-[1.586] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-2xl flex flex-col justify-between transition-colors duration-300"
                style={{
                  background: `linear-gradient(135deg, ${cardColor}1A 0%, ${cardColor}08 40%, #080d1a 100%)`,
                  borderColor: `${cardColor}25`,
                }}
              >
                {/* Glow del color activo */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${cardColor}15` }} />

                {/* Encabezado */}
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                      {React.createElement(activeSector.icon, { className: 'w-4 h-4' })}
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-white leading-tight truncate max-w-[160px]">
                        {activeSector.cardTitle}
                      </h5>
                      {showSubtitle && (
                        <p className="text-[8px] text-slate-400 tracking-wider font-semibold">
                          {activeSector.cardSubtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Status */}
                  <span className="px-1.5 py-0.5 rounded-full text-[7px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIVA
                  </span>
                </div>

                {/* Cuerpo con foto y campos */}
                <div className="flex items-center gap-4 my-2 relative z-10">
                  {showPhoto && (
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 overflow-hidden">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-white truncate">Juan Pérez Muñoz</p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {activeSector.cardFields.map((f, i) => (
                        <div key={i}>
                          <span className="text-[6px] text-slate-500 block uppercase font-medium">{f.label}</span>
                          <span className="text-[8px] text-slate-300 font-mono block leading-none">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer del Carnet */}
                <div className="flex items-end justify-between pt-1 border-t border-white/5 relative z-10">
                  <div className="text-[6px] text-slate-500">
                    <span>Emitido vía</span>
                    <span className="text-slate-300 font-bold block">SkardKey ID</span>
                  </div>
                  <div className="w-9 h-9 bg-white rounded-lg p-0.5 shadow-md flex items-center justify-center">
                    <QrCode className="w-full h-full text-slate-950" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="w-full max-w-xl mx-auto p-5 bg-surface-900 border border-white/10 rounded-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-brand-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Importador masivo (.xlsx/.csv)</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Padrón de Afiliados</span>
            </div>

            {/* Simulación del archivo cargado */}
            <div className="overflow-hidden border border-white/5 rounded-xl bg-surface-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[9px] uppercase tracking-wider text-slate-400 font-semibold border-b border-white/5">
                    <th className="p-2.5">Nombre Completo</th>
                    <th className="p-2.5">RUT</th>
                    <th className="p-2.5 text-center">Estado del Carnet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {beneficiaries.map((b) => (
                    <tr key={b.id} className="hover:bg-white/[0.02]">
                      <td className="p-2.5 text-white font-medium">{b.name}</td>
                      <td className="p-2.5 text-slate-400 font-mono">{b.rut}</td>
                      <td className="p-2.5 text-center">
                        {b.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold">
                            <Check className="w-2.5 h-2.5" />
                            Emitido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 font-bold animate-pulse">
                            Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              {importStatus === 'idle' && (
                <button
                  onClick={handleStartImport}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/25 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Procesar Padrón y Emitir Credenciales
                </button>
              )}

              {importStatus === 'importing' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Emitiendo credenciales con QR...
                    </span>
                    <span className="text-brand-400 font-bold font-mono">{importProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {importStatus === 'done' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-white">¡Emisión Masiva Completada!</h5>
                      <p className="text-[10px] text-slate-400">Se han generado 3 tarjetas digitales con código QR único y seguro.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveStep(4)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Ir al Validador QR (Siguiente Paso)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="w-full grid md:grid-cols-2 gap-6 items-stretch animate-fade-in">
            {/* Lector QR Móvil */}
            <div className="p-5 bg-surface-900 border border-white/10 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-4 h-4 text-brand-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Lector QR Integrado</h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                  Simula el escaneo seleccionando un miembro de abajo. Nuestro sistema es una Web App y funciona en celulares sin instalar nada.
                </p>
              </div>

              {/* Viewport del Scanner */}
              <div className="relative aspect-square max-w-[200px] mx-auto w-full bg-surface-950 border border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center">
                {isScanning ? (
                  <>
                    <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-bounce z-10" />
                    <QrCode className="w-16 h-16 text-slate-700 opacity-60" />
                    <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest mt-2 animate-pulse">Escaneando...</span>
                  </>
                ) : scanResult === 'valid' && scannedUser ? (
                  <div className="text-center p-3 space-y-2 animate-scale-in">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="px-1.5 py-0.5 rounded-full text-[7px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 font-bold">
                        VÁLIDA
                      </span>
                      <p className="text-[10px] font-bold text-white mt-1.5 truncate max-w-[160px]">{scannedUser.name}</p>
                      <p className="text-[8px] text-slate-500 font-mono mt-0.5">{scannedUser.rut}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-[8px] text-slate-500 max-w-[120px] mx-auto">Selecciona un miembro emitido abajo para iniciar escaneo</p>
                  </div>
                )}
              </div>

              {/* Botón de reinicio */}
              <button
                onClick={handleResetSimulator}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reiniciar Simulación
              </button>
            </div>

            {/* Listado de Emitidos y Logs */}
            <div className="p-5 bg-surface-900 border border-white/10 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Miembros Emitidos</h4>
                </div>
                
                {importStatus !== 'done' ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-2">
                    <ShieldAlert className="w-6 h-6 text-amber-500 mx-auto" />
                    <p className="text-xs font-bold text-white">Sin credenciales emitidas</p>
                    <p className="text-[9px] text-slate-400">Primero ve al paso 3 e importa el padrón.</p>
                    <button
                      onClick={() => setActiveStep(3)}
                      className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-[9px] rounded-lg"
                    >
                      Ir al Paso 3
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {beneficiaries.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleScanUser(b)}
                        disabled={isScanning}
                        className="w-full p-2.5 bg-surface-950 hover:bg-surface-850 border border-white/5 hover:border-brand-500/30 rounded-xl text-left transition-all flex items-center justify-between"
                      >
                        <div>
                          <p className="text-[10px] font-bold text-white">{b.name}</p>
                          <p className="text-[8px] text-slate-500 font-mono">{b.rut}</p>
                        </div>
                        <span className="text-[8px] font-semibold text-brand-400 flex items-center gap-1">
                          Escanear <ChevronRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Registro Histórico */}
              {scanResult === 'valid' && scannedUser && (
                <div className="p-2.5 bg-surface-950 border border-emerald-500/20 rounded-xl space-y-1.5 animate-slide-in">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[8px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Registro de Acceso Exitoso
                  </div>
                  <div className="text-[7px] text-slate-400 leading-normal space-y-0.5">
                    <p><strong className="text-white">Organización:</strong> {activeSector.cardTitle}</p>
                    <p><strong className="text-white">Acción:</strong> Validado con QR en Punto de Control</p>
                    <p><strong className="text-white">Fecha/Hora:</strong> {new Date().toLocaleString('es-CL')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-[#020617] data-grain">
      {/* Elementos Decorativos de Fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Flujo interactivo paso a paso
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            ¿Cómo funciona{' '}
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-300 bg-clip-text text-transparent">
              SkardKey
            </span>
            ?
          </h1>
          
          <p className="text-base text-slate-400 leading-relaxed">
            Nuestra plataforma te permite emitir, diseñar y verificar credenciales inteligentes en minutos. 
            Descubre a continuación cómo se adapta a tu sector y prueba el flujo de administración.
          </p>
        </div>

        {/* ═══════════════ SELECTOR DE SECTOR ═══════════════ */}
        <div className="mb-12 animate-fade-in">
          <div className="text-center mb-6">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">Paso Inicial: Selecciona tu Sector</span>
            <p className="text-xs text-slate-400">Verás cómo cambia la identidad de las credenciales digitales y sus características clave.</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            {SECTORS.map((sector) => {
              const IconComponent = sector.icon;
              const isActive = activeSector.id === sector.id;
              
              return (
                <button
                  key={sector.id}
                  onClick={() => {
                    setActiveSector(sector);
                    setCardColor(sector.defaultColor);
                    setScannedUser(null);
                    setScanResult('idle');
                  }}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all hover:scale-[1.02] cursor-pointer ${
                    isActive
                      ? `bg-surface-900 text-white ${sector.borderColorClass} shadow-lg shadow-brand-500/5`
                      : 'bg-transparent text-slate-400 border-white/5 hover:text-white hover:border-white/10'
                  }`}
                >
                  <span className={isActive ? sector.colorClass : 'text-slate-500'}>
                    <IconComponent className="w-5 h-5" />
                  </span>
                  <span>{sector.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════ DETALLES DEL SECTOR SELECCIONADO ═══════════════ */}
        <div className="mb-20 grid md:grid-cols-2 gap-8 items-center bg-gradient-to-b from-surface-900/40 to-surface-950/20 border border-white/5 rounded-3xl p-8 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-white/5 border border-white/10 text-white">
              {React.createElement(activeSector.icon, { className: `w-4 h-4 ${activeSector.colorClass}` })}
              <span>Solución para {activeSector.name}</span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">
              Credenciales Inteligentes Diseñadas para {activeSector.name}
            </h3>
            
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              El panel se configura automáticamente para recopilar los campos clave y las reglas necesarias para tu tipo de organización.
              Olvídate de la burocracia, los plazos de entrega físicos y los costos de impresión elevados.
            </p>
            
            <ul className="space-y-3.5">
              {activeSector.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-surface-900/60 border border-white/5 rounded-2xl relative overflow-hidden">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">Visualización en Celular</span>
            
            {/* Teléfono Mockup */}
            <div className="w-[240px] aspect-[19.5/9] bg-slate-950 border-[6px] border-slate-800 rounded-[36px] shadow-2xl relative p-4 flex flex-col justify-between overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-b-xl z-20" />
              
              {/* Credencial en Celular */}
              <div className="h-full flex flex-col justify-between py-2 relative z-10">
                {/* Header celular */}
                <div className="text-center mt-2">
                  <h4 className="text-[10px] font-black text-white leading-none">{activeSector.cardTitle}</h4>
                  <p className="text-[7px] text-slate-500 mt-1 uppercase font-semibold">{activeSector.cardSubtitle}</p>
                </div>

                {/* Avatar simulado */}
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-slate-500 my-2 overflow-hidden">
                  <User className="w-8 h-8 text-slate-400" />
                </div>

                {/* Datos */}
                <div className="space-y-1 px-2 text-center">
                  <p className="text-[10px] font-bold text-white">Juan Pérez Muñoz</p>
                  <div className="flex justify-center gap-3 text-[7px] text-slate-400 font-mono">
                    {activeSector.cardFields.map((f, i) => (
                      <span key={i}>
                        {f.label}: {f.value}
                      </span>
                    ))}
                  </div>
                </div>

                {/* QR en Celular */}
                <div className="w-14 h-14 bg-white rounded-xl p-1.5 mx-auto mt-2 flex items-center justify-center">
                  <QrCode className="w-full h-full text-slate-950" />
                </div>

                {/* Estado */}
                <div className="text-center mt-2">
                  <span className="px-2 py-0.5 rounded-full text-[6px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold">
                    CREDENCIAL ACTIVA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ SIMULADOR DEL FLUJO DE ADMINISTRACIÓN ═══════════════ */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-2 block">Pruébalo en Vivo</span>
            <h2 className="text-3xl font-bold text-white">Simulador del Portal Administrador</h2>
            <p className="text-slate-400 max-w-xl mx-auto mt-2">Prueba paso a paso el panel de control. Utiliza las herramientas interactivas de la derecha.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            {/* Lado Izquierdo: Pasos */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              {[
                {
                  num: 1,
                  title: '1. Acceso con Perfil',
                  desc: 'Inicia sesión de forma segura. El portal se personaliza de forma instantánea con el logotipo y padrón de tu organización.'
                },
                {
                  num: 2,
                  title: '2. Diseñador Digital',
                  desc: 'Configura colores institucionales, fotos y campos dinámicos en tiempo real sin requerir conocimientos de código.'
                },
                {
                  num: 3,
                  title: '3. Carga y Emisión Masiva',
                  desc: 'Sube tu padrón de afiliados usando una planilla Excel. El sistema generará y emitirá los carnets virtuales al instante.'
                },
                {
                  num: 4,
                  title: '4. Validación por QR',
                  desc: 'Verifica vigencias y registra visitas escaneando el QR con un celular en terreno. La trazabilidad queda asegurada.'
                }
              ].map((step) => {
                const isActive = activeStep === step.num;
                return (
                  <button
                    key={step.num}
                    onClick={() => setActiveStep(step.num)}
                    className={`text-left p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
                      isActive
                        ? 'bg-surface-900/90 border-brand-500/30 shadow-xl shadow-brand-500/5'
                        : 'bg-transparent border-white/5 hover:border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isActive ? 'bg-brand-500 text-white' : 'bg-surface-950 text-slate-500 border border-white/5'
                    }`}>
                      {step.num}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-base font-bold mb-1.5 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Lado Derecho: Simulador Vivo */}
            <div className="lg:col-span-7 bg-[#090e1a]/80 border border-brand-500/10 rounded-3xl p-6 flex items-center justify-center relative min-h-[380px] shadow-2xl overflow-hidden">
              {/* Grid de fondo decorativo para el simulador */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              
              <div className="w-full relative z-10">
                {renderSimulatorVisual()}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ FINAL CTA ═══════════════ */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-950/40 via-surface-900 to-purple-950/20 border border-brand-500/20 p-8 md:p-12 text-center shadow-xl shadow-brand-500/10">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <h2 className="text-3xl font-bold text-white mb-4">¿Listo para modernizar tu organización?</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm mb-8 leading-relaxed">
            Te ayudamos a implementar el sistema en minutos. Si eres de una Junta de Vecinos, el servicio es 100% gratuito para siempre.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/contacto" className="btn-primary px-8 py-3.5 text-sm font-semibold flex items-center gap-2">
              <span>Solicitar Demo Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={handleResetSimulator}
              className="btn-secondary px-6 py-3.5 text-sm font-medium flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reiniciar Simulación</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ComoFuncionaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 pb-20 bg-[#020617]" />}>
      <ComoFuncionaContent />
    </Suspense>
  );
}
