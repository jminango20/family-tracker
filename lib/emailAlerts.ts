// lib/emailAlerts.ts
interface AlertData {
  childName: string;
  parentEmail: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  routeName?: string;
  alertType: 'exit_route' | 'enter_route' | 'low_battery' | 'sos';
}

// Enviar alerta por email usando API route
export const sendAlert = async (alertData: AlertData) => {
  try {
    console.log('📧 Enviando alerta por email...', alertData);

    const response = await fetch('/api/send-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Error enviando email:', result);
      return { success: false, error: result.error };
    }

    console.log('✅ Email enviado exitosamente:', result);
    return { success: true, data: result.data };

  } catch (error) {
    console.error('❌ Error en sistema de alertas:', error);
    return { success: false, error };
  }
};

// Evitar spam - solo enviar si han pasado X minutos desde la última alerta
const lastAlertTime: { [key: string]: Date } = {};

export const shouldSendAlert = (childName: string, alertType: string, cooldownMinutes: number = 5): boolean => {
  const alertKey = `${childName}_${alertType}`;
  const now = new Date();
  const lastAlert = lastAlertTime[alertKey];
  
  if (!lastAlert) {
    lastAlertTime[alertKey] = now;
    return true;
  }
  
  const minutesSinceLastAlert = (now.getTime() - lastAlert.getTime()) / (1000 * 60);
  
  if (minutesSinceLastAlert >= cooldownMinutes) {
    lastAlertTime[alertKey] = now;
    return true;
  }
  
  console.log(`⏰ Alerta en cooldown. Faltan ${(cooldownMinutes - minutesSinceLastAlert).toFixed(1)} minutos`);
  return false;
};