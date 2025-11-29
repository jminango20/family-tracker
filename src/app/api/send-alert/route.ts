// src/app/api/send-alert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childName, parentEmail, location, timestamp, routeName, alertType } = body;

    // Validar datos
    if (!childName || !parentEmail || !location || !alertType) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    console.log('📧 Procesando alerta:', { childName, parentEmail, alertType });

    // Generar contenido del email
    const subject = getSubject(alertType, childName);
    const htmlContent = getEmailHTML({
      childName,
      location,
      timestamp: new Date(timestamp),
      routeName,
      alertType
    });

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: 'Family Tracker <onboarding@resend.dev>', // Usar dominio de Resend para testing
      to: [parentEmail],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Error enviando email:', error);
      return NextResponse.json(
        { error: 'Error enviando email', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Email enviado exitosamente:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('❌ Error en API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Generar asunto del email
function getSubject(alertType: string, childName: string): string {
  switch (alertType) {
    case 'exit_route':
      return `🚨 ${childName} está fuera de la ruta segura`;
    case 'enter_route':
      return `✅ ${childName} ha regresado a la ruta segura`;
    case 'low_battery':
      return `🔋 Batería baja del dispositivo de ${childName}`;
    case 'sos':
      return `🆘 EMERGENCIA: Alerta SOS de ${childName}`;
    default:
      return `📱 Alerta de Family Tracker: ${childName}`;
  }
}

// Generar contenido HTML del email
function getEmailHTML(alertData: {
  childName: string;
  location: { lat: number; lng: number };
  timestamp: Date;
  routeName?: string;
  alertType: string;
}): string {
  const { childName, location, timestamp, routeName, alertType } = alertData;
  
  const alertIcon = alertType === 'exit_route' ? '🚨' : '✅';
  const alertColor = alertType === 'exit_route' ? '#dc2626' : '#16a34a';
  const alertMessage = alertType === 'exit_route' 
    ? 'está fuera de la ruta segura' 
    : 'ha regresado a la ruta segura';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Family Tracker Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background-color: ${alertColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">
            ${alertIcon} Family Tracker Alert
          </h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          
          <h2 style="color: ${alertColor}; margin-top: 0;">
            ${childName} ${alertMessage}
          </h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">📍 Detalles de la ubicación:</h3>
            <p><strong>Persona:</strong> ${childName}</p>
            <p><strong>Hora:</strong> ${timestamp.toLocaleString('es-ES')}</p>
            <p><strong>Latitud:</strong> ${location.lat.toFixed(6)}</p>
            <p><strong>Longitud:</strong> ${location.lng.toFixed(6)}</p>
            ${routeName ? `<p><strong>Ruta:</strong> ${routeName}</p>` : ''}
          </div>

          <!-- Google Maps Link -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.google.com/maps?q=${location.lat},${location.lng}" 
               style="background-color: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              🗺️ Ver en Google Maps
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            <p>Este es un mensaje automático de Family Tracker</p>
            <p>Para más información, revisa la aplicación web</p>
          </div>
          
        </div>
      </div>
    </body>
    </html>
  `;
}