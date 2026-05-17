'use client';

import { useState } from 'react';
import { 
  Mail, 
  User, 
  Building2, 
  Phone, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Loader2,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { sendContactEmail } from '@/app/actions/contact';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await sendContactEmail(formData);
      if (result.success) {
        setSuccess(true);
        setFormData({ name: '', organization: '', email: '', phone: '', message: '' });
      } else {
        setError('Hubo un error al enviar el mensaje. Por favor intenta de nuevo.');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al inicio
        </Link>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Text Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Solicita tu demostración
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1]">
              Impulsa tu organización con{' '}
              <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
                identidad digital
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              Completa el formulario y nos pondremos en contacto contigo para coordinar una demo personalizada de SkardKey adaptada a las necesidades de tu institución.
            </p>

            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Demo 100% personalizada</h3>
                  <p className="text-slate-500 text-sm">Explora las funciones que realmente importan para tu tipo de organización.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Sin compromiso</h3>
                  <p className="text-slate-500 text-sm">Prueba la plataforma gratis y decide si es lo que necesitas para digitalizar tu gestión.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="glass-card p-8 lg:p-10 relative">
            {success ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¡Solicitud Enviada!</h2>
                <p className="text-slate-400 mb-8">
                  Gracias por tu interés en SkardKey. Nos pondremos en contacto contigo a la brevedad en el correo <strong>{formData.email}</strong>.
                </p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="btn-secondary px-8 py-3 text-sm"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Juan Pérez"
                        className="glass-input w-full pl-11 pr-4 py-3 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Organización</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="Nombre de tu institución"
                        className="glass-input w-full pl-11 pr-4 py-3 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Correo Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ejemplo@skardkey.cl"
                        className="glass-input w-full pl-11 pr-4 py-3 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+56 9 ..."
                        className="glass-input w-full pl-11 pr-4 py-3 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mensaje (Opcional)</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-500" />
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Cuéntanos un poco sobre lo que buscas..."
                      className="glass-input w-full pl-11 pr-4 py-3 text-sm min-h-[120px] resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 group shadow-xl shadow-brand-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Solicitar Demo Gratis
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest">
                  Al enviar, aceptas nuestras políticas de privacidad y contacto.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
