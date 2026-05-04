'use server';

import { sendTransactionalEmail } from '@/lib/email';

interface CertificateEmailData {
  to: string;
  name: string;
  type: string;
  folio: string;
  rut: string;
  orgName: string;
  url: string;
  customFields?: Record<string, string>;
}

/**
 * Acción de servidor para enviar la notificación de documento (certificado/tarjeta) emitido
 */
export async function sendCertificateNotification(data: CertificateEmailData) {
  const TEMPLATE_ID = 1; // ID de tu plantilla base en Brevo

  let customFieldsText = '';
  if (data.customFields && Object.keys(data.customFields).length > 0) {
    customFieldsText = '\n\nInformación Adicional:\n' + 
      Object.entries(data.customFields)
        .map(([key, val]) => `• ${key}: ${val}`)
        .join('\n');
  }

  return await sendTransactionalEmail({
    to: data.to,
    subject: `¡Aquí tienes tu nuevo documento! - Folio ${data.folio}`,
    templateId: TEMPLATE_ID,
    params: {
      name: data.name,
      message: `Te informamos que se ha emitido un nuevo documento de tipo "${data.type}" a tu nombre desde la institución ${data.orgName}.`,
      details: `Detalles del Documento:\n• Folio: ${data.folio}\n• RUT: ${data.rut}\n• Institución: ${data.orgName}${customFieldsText}`,
      button_text: 'Ver y Descargar Documento',
      url: data.url,
    },
  });
}
