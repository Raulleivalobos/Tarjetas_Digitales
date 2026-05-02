'use server';

import { sendTransactionalEmail } from '@/lib/email';

interface CertificateEmailData {
  to: string;
  name: string;
  type: string;
  folio: string;
  rut: string;
  orgName: string;
}

/**
 * Acción de servidor para enviar la notificación de certificado emitido
 */
export async function sendCertificateNotification(data: CertificateEmailData) {
  const TEMPLATE_ID = 1; // ID de tu plantilla base en Brevo

  return await sendTransactionalEmail({
    to: data.to,
    subject: `Nuevo Certificado Emitido - Folio ${data.folio}`,
    templateId: TEMPLATE_ID,
    params: {
      name: data.name,
      message: `Te informamos que se ha emitido un nuevo certificado de tipo "${data.type}" a tu nombre desde la organización ${data.orgName}.`,
      details: `Detalles del Documento:\n• Folio: ${data.folio}\n• RUT: ${data.rut}\n• Organización: ${data.orgName}`,
      button_text: 'Ir a SkardKey',
      url: 'https://skardkey.cl/dashboard',
    },
  });
}
