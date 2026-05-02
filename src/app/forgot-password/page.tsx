'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { sendResetPasswordEmail } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await sendResetPasswordEmail(email);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Ocurrió un error al enviar el correo');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al inicio de sesión
        </Link>

        <div className="bg-surface-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          {success ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Revisa tu correo</h2>
              <p className="text-slate-400 mb-8">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
              </p>
              <Link href="/login" className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                Volver al Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Recuperar clave</h1>
              <p className="text-slate-400 mb-8">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="glass-input w-full pl-12 pr-4 py-3.5 text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Enviando...' : 'Enviar enlace'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
