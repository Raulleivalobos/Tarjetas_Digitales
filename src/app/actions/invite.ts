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
    // 1. Invitar al usuario via Supabase Auth
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      data: {
        invited_to_org: orgId,
        invited_role: role
      }
    });

    // Si el usuario ya existe, inviteError será "User already registered"
    // En ese caso, igual queremos que sepa que fue invitado a ESTA organización
    
    // 2. Intentar crear la membresía de forma preventiva (o pre-autorizar)
    // Usaremos una tabla 'org_invites' o simplemente le pediremos que use el accessCode
    
    // 3. Enviar correo personalizado vía Brevo
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
      templateId: 1, // ID de plantilla en Brevo (ej: Invitación)
      params: {
        name: email.split('@')[0], // Usamos la parte del correo como nombre temporal
        message: `Has sido invitado a colaborar con la institución "${orgName}" en la plataforma SkardKey.`,
        details: `Información de tu acceso:\n• Institución: ${orgName}\n• Rol asignado: ${roleNames[role] || role}\n• Código de Acceso: ${accessCode}\n\nPuedes ingresar usando tu correo y este código de acceso en el portal administrativo.`,
        button_text: 'Aceptar Invitación e Ingresar',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
      }
    });

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      // Opcional: No fallar la invitación si solo falló el correo, 
      // pero el usuario igual puede entrar con el link de Supabase
    }

    return { success: true };
  } catch (error: any) {
    console.error('Invite Error:', error);
    return { success: false, error: error.message };
  }
}
