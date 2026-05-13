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
    // Aseguramos que la clave temporal tenga al menos 6 caracteres (requisito de Supabase)
    const tempPassword = accessCode.length >= 6 ? accessCode : accessCode.padEnd(6, '0');

    // 1. Intentar crear o actualizar el usuario
    let userId: string | undefined;
    
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        force_password_change: true,
        invited_to_org: orgId,
        invited_role: role
      }
    });

    if (createError && createError.message === 'User already registered') {
      // Si ya existe, lo buscamos para actualizar su clave y flag
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = listData.users.find(u => u.email === email);
      
      if (existingUser) {
        userId = existingUser.id;
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: tempPassword,
          user_metadata: {
            force_password_change: true,
            invited_to_org: orgId,
            invited_role: role
          }
        });
      }
    } else if (userData?.user) {
      userId = userData.user.id;
    }

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
        details: `Información de tu acceso:<br>• Institución: ${orgName}<br>• Rol asignado: ${roleNames[role] || role}<br><br><strong>TU CLAVE TEMPORAL ES: ${tempPassword}</strong><br>(El sistema te pedirá cambiarla por una nueva al ingresar).`,
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
