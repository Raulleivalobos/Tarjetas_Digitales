'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, ArrowRight, CheckCircle2, EyeOff, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Escuchar el evento de autenticación cuando el código de la URL se intercambia por una sesión
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // El usuario viene del enlace de recuperación
        console.log('Recovery session ready');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Actualizamos la contraseña del usuario autenticado
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          {success ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">¡Contraseña Actualizada!</h2>
              <p className="text-slate-400 mb-8">
                Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva clave.
              </p>
              <Link href="/login" className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                Ir a Iniciar Sesión
              </Link>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white mb-2">Crear nueva clave</h1>
              <p className="text-slate-400 mb-8">
                Ingresa tu nueva contraseña para acceder a tu cuenta en SkardKey.
              </p>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input w-full pl-12 pr-12 py-3.5 text-sm"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || password.length < 6}
                  className="btn-primary w-full py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Guardando...' : 'Actualizar contraseña'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
