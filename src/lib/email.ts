/**
 * Motor de correos transaccionales usando Brevo API v3
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface EmailParams {
  to: string;
  subject: string;
  templateId: number;
  params: Record<string, any>;
}

/**
 * Envía un correo electrónico transaccional usando una plantilla de Brevo
 */
export async function sendTransactionalEmail({ to, subject, templateId, params }: EmailParams) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ BREVO_API_KEY no configurada. Saltando envío de correo.');
    return { success: false, error: 'API Key missing' };
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'SkardKey',
          email: 'contacto@skardkey.cl',
        },
        to: [{ email: to }],
        templateId: templateId,
        params: {
          subject,
          ...params
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de Brevo:', errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error };
  }
}

/**
 * Envía un correo electrónico con contenido HTML personalizado
 */
export async function sendCustomEmail({ to, subject, htmlContent }: { to: string, subject: string, htmlContent: string }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ BREVO_API_KEY no configurada.');
    return { success: false, error: 'API Key missing' };
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'SkardKey Notificaciones',
          email: 'contacto@skardkey.cl',
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de Brevo:', errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ Error enviando email custom:', error);
    return { success: false, error };
  }
}
