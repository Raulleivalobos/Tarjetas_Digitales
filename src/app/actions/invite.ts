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
    await sendTransactionalEmail({
      to: email,
      subject: `Invitación a colaborar en ${orgName}`,
      templateId: 1, // ID de plantilla en Brevo (ej: Invitación)
      params: {
        org_name: orgName,
        role_name: role === 'admin' ? 'Administrador' : role === 'validator' ? 'Validador' : 'Visualizador',
        access_code: accessCode,
        login_url: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Invite Error:', error);
    return { success: false, error: error.message };
  }
}
