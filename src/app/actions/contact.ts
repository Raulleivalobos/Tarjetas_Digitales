'use server';

import { sendCustomEmail } from '@/lib/email';

export async function sendContactEmail(formData: {
  name: string;
  organization: string;
  email: string;
  phone: string;
  message: string;
}) {
  const { name, organization, email, phone, message } = formData;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center; }
        .content { padding: 20px; background: #ffffff; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
        .value { font-size: 16px; color: #1e293b; margin-top: 4px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
        .badge { display: inline-block; padding: 4px 12px; background: #f1f5f9; border-radius: 99px; font-size: 12px; color: #475569; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Nueva Solicitud de Demo</h1>
        </div>
        <div class="content">
          <div class="badge">Lead de SkardKey.cl</div>
          
          <div class="field">
            <div class="label">Nombre del Contacto</div>
            <div class="value">${name}</div>
          </div>
          
          <div class="field">
            <div class="label">Organización / Institución</div>
            <div class="value">${organization}</div>
          </div>
          
          <div class="field">
            <div class="label">Correo Electrónico</div>
            <div class="value"><a href="mailto:${email}" style="color: #6366f1; text-decoration: none;">${email}</a></div>
          </div>
          
          <div class="field">
            <div class="label">Teléfono de Contacto</div>
            <div class="value"><a href="tel:${phone}" style="color: #6366f1; text-decoration: none;">${phone}</a></div>
          </div>
          
          <div class="field" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
            <div class="label">Mensaje o Interés</div>
            <div class="value" style="white-space: pre-wrap;">${message || 'Interesado en solicitar una demo de la plataforma.'}</div>
          </div>
        </div>
        <div class="footer">
          Este correo fue generado automáticamente desde el formulario de contacto de skardkey.cl
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendCustomEmail({
    to: 'contacto@skardkey.cl',
    subject: `🚀 Nueva solicitud de demo: ${organization}`,
    htmlContent,
  });
}
