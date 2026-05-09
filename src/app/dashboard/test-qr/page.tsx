'use client';

import { useState, useEffect, useRef} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { CreditCard, Smartphone, Wifi, ArrowRight, Copy, CheckCircle, QrCode } from 'lucide-react';

export default function TestQRPage() {
  const { organization } = useAuth();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [networkIP, setNetworkIP] = useState('');

  useEffect(() => {
    // Detect the current network address
    setNetworkIP(window.location.origin.replace('localhost', '192.168.1.7'));
  }, []);

  useEffect(() => {
    if (!organization) return;
    async function load() {
      const { data } = await supabase
        .from('digital_cards')
        .select('*, beneficiary:beneficiaries(full_name, rut)')
        .eq('org_id', organization!.id)
        .eq('status', 'active');
      setCards(data || []);
      setLoading(false);
    }
    load();
  }, [organization]);

  function getQRUrl(card: any) {
    const slug = organization?.slug || 'org';
    return `${window.location.origin}/validate/${slug}/${card.id}`;
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <QrCode className="w-8 h-8 text-brand-400" /> Centro de Pruebas QR
        </h1>
        <p className="text-slate-400 mt-1">Usa esta página para probar el escaneo de QR en los módulos de Beneficios y Asistencia</p>
      </div>

      {/* Instructions */}
      <div className="glass-card-solid p-6 rounded-2xl border border-brand-500/20 space-y-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-brand-400" /> Guía de Pruebas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: From laptop */}
          <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/20 space-y-3">
            <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Opción A: Desde la Laptop
            </h3>
            <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
              <li>Abre <strong className="text-white">Beneficios → Entregar con QR</strong> o <strong className="text-white">Asistencia → Reunión → Ver</strong></li>
              <li>Presiona <strong className="text-white">"Abrir Cámara"</strong></li>
              <li>Muestra uno de los QR de abajo <strong className="text-white">en tu celular</strong> o <strong className="text-white">imprímelo</strong></li>
              <li>Apunta la cámara de tu laptop al QR</li>
            </ol>
          </div>

          {/* Option B: From phone */}
          <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <Wifi className="w-4 h-4" /> Opción B: Desde el Celular
            </h3>
            <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
              <li>Conecta tu celular al <strong className="text-white">mismo WiFi</strong> que la laptop</li>
              <li>En el celular abre Chrome y navega a:</li>
            </ol>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <code className="text-[10px] bg-white/5 px-3 py-1.5 rounded-lg text-brand-400 font-bold flex-1 overflow-x-auto">
                  {networkIP}/dashboard/benefits/deliver
                </code>
                <button onClick={() => copyToClipboard(`${networkIP}/dashboard/benefits/deliver`, 'ben')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-all shrink-0">
                  {copied === 'ben' ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-[10px] bg-white/5 px-3 py-1.5 rounded-lg text-brand-400 font-bold flex-1 overflow-x-auto">
                  {networkIP}/dashboard/attendance
                </code>
                <button onClick={() => copyToClipboard(`${networkIP}/dashboard/attendance`, 'att')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-all shrink-0">
                  {copied === 'att' ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-yellow-400 mt-2">⚠️ Si la cámara no funciona en HTTP, ve a <strong>chrome://flags</strong> en tu celular y activa "Insecure origins treated as secure" con la URL de tu laptop.</p>
          </div>
        </div>
      </div>

      {/* QR Codes Grid */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Tarjetas QR de Socios ({cards.length})
        </h2>
        
        {cards.length === 0 ? (
          <div className="glass-card-solid p-12 rounded-2xl text-center">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay tarjetas emitidas. Ve a "Emitir" para crear tarjetas primero.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(card => (
              <div key={card.id} className="glass-card-solid p-6 rounded-2xl border border-white/5 hover:border-brand-500/20 transition-all text-center space-y-4">
                <div className="bg-white p-4 rounded-2xl inline-block mx-auto">
                  <QRCodeSVG
                    value={getQRUrl(card)}
                    size={160}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{card.beneficiary?.full_name}</p>
                  <p className="text-xs text-slate-500 font-mono">{card.beneficiary?.rut}</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[8px] bg-white/5 px-2 py-1 rounded text-slate-500 flex-1 truncate">{card.id.slice(0, 18)}...</code>
                  <button onClick={() => copyToClipboard(getQRUrl(card), card.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-all shrink-0">
                    {copied === card.id ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick flow test */}
      <div className="glass-card-solid p-6 rounded-2xl border border-white/5">
        <h3 className="text-sm font-bold text-white mb-4">Flujo de Prueba Rápida</h3>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="px-3 py-2 rounded-xl bg-brand-500/10 text-brand-400 font-bold">1. Muestra un QR de arriba</span>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <span className="px-3 py-2 rounded-xl bg-purple-500/10 text-purple-400 font-bold">2. Abre el Escáner</span>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <span className="px-3 py-2 rounded-xl bg-green-500/10 text-green-400 font-bold">3. Escanea con la cámara</span>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <span className="px-3 py-2 rounded-xl bg-yellow-500/10 text-yellow-400 font-bold">4. ¡Beneficio entregado / Asistencia registrada!</span>
        </div>
      </div>
    </div>
  );
}
