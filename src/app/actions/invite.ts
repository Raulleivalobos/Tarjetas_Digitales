'use server';

import { createClient } from '@supabase/supabase-js';
import { sendTransactionalEmail } from '@/lib/email';

export async function inviteUserToOrg({ 
  email, 
  role, 
  orgId, 
  orgName,
  accessCode 
}: { 
  email: string; 
  role: string; 
  orgId: string; 
  orgName: string;
  accessCode: string;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Crear el usuario con una contraseña temporal (el código de acceso)
    // Esto permite que el usuario entre de inmediato.
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: accessCode, // Usamos el código de acceso como clave temporal
      email_confirm: true,
      user_metadata: {
        force_password_change: true,
        invited_to_org: orgId,
        invited_role: role
      }
    });

    // Si el usuario ya existe, no es un error crítico, 
    // solo significa que ya tiene su propia cuenta y clave.
    if (createError && createError.message !== 'User already registered') {
      console.error('Error creating user:', createError);
    }

    const isNewUser = !createError;
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://skardkey.cl'}/login`;

    // 2. Enviar correo personalizado vía Brevo
    const roleNames: Record<string, string> = {
      admin: 'Administrador',
      validator: 'Validador',
      viewer: 'Visualizador',
      auditor: 'Auditor',
      municipal_admin: 'Admin Municipal',
      municipal_viewer: 'Observador Municipal',
    };

    const emailResult = await sendTransactionalEmail({
      to: email,
      subject: `Invitación a colaborar en ${orgName}`,
      templateId: 1, // ID de plantilla en Brevo
      params: {
        name: email.split('@')[0],
        message: `Has sido invitado a colaborar con la institución "${orgName}" en la plataforma SkardKey.`,
        details: `Información de tu acceso:\n• Institución: ${orgName}\n• Rol asignado: ${roleNames[role] || role}\n\n${isNewUser ? `TU CLAVE TEMPORAL ES: ${accessCode}\n(Se te pedirá cambiarla al ingresar por primera vez)` : 'Usa tu correo y contraseña habitual para ingresar.'}`,
        button_text: 'Ingresar al Panel de Control',
        url: inviteLink
      }
    });

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Invite Error:', error);
    return { success: false, error: error.message };
  }
}
