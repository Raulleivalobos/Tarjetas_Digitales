'use server';

import { sendTransactionalEmail } from '@/lib/email';

export async function sendContactEmail(formData: {
  name: string;
  organization: string;
  email: string;
  phone: string;
  message: string;
}) {
  const { name, organization, email, phone, message } = formData;

  const TEMPLATE_ID = 1; // Misma plantilla con logo de SkardKey

  return await sendTransactionalEmail({
    to: 'contacto@skardkey.cl',
    subject: `🚀 Nueva solicitud de demo: ${organization}`,
    templateId: TEMPLATE_ID,
    params: {
      name: 'Equipo SkardKey',
      message: `Has recibido una nueva solicitud de demostración desde tu sitio web.`,
      details: `Datos del Solicitante:\n• Nombre: ${name}\n• Organización: ${organization}\n• Correo: ${email}\n• Teléfono: ${phone}\n• Mensaje: ${message || 'Sin mensaje adicional.'}`,
      button_text: 'Responder al cliente',
      url: `mailto:${email}`,
    },
  });
}
