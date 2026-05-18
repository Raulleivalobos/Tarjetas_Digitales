'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Acción de servidor para solicitar recuperación de contraseña
 */
export async function sendResetPasswordEmail(email: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://skardkey.cl'}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
