import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // If it's a reset password request, usually there's no specific next param, 
      // but we want to intercept if it was a reset flow.
      // Wait, we can just redirect to /reset-password if 'next' is not defined, 
      // or if it specifically was a reset password link.
      // The reset password link configures redirectTo to /reset-password
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // URL to redirect to after sign up or if exchange fails
  // fallback
  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
}
