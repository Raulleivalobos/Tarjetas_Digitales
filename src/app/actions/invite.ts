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
    // 1. Generar link de invitación (esto no envía correo automáticamente)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://skardkey.cl'}/dashboard`,
        data: {
          invited_to_org: orgId,
          invited_role: role
        }
      }
    });

    if (linkError) {
      // Si el usuario ya existe, intentamos invitarlo igual a la organización 
      // (Supabase lanzará error si ya tiene cuenta, pero igual podemos proceder con el correo)
      console.warn('Link generation warning:', linkError.message);
    }

    const inviteLink = linkData?.properties?.action_link || `${process.env.NEXT_PUBLIC_APP_URL || 'https://skardkey.cl'}/login`;

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
        details: `Información de tu acceso:\n• Institución: ${orgName}\n• Rol asignado: ${roleNames[role] || role}\n• Código de Acceso: ${accessCode}\n\nPara activar tu cuenta y configurar tu contraseña, haz clic en el botón de abajo.`,
        button_text: 'Activar Cuenta y Configurar Contraseña',
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
