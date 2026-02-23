
import { TokenNotification } from '../types';

/**
 * Unified Notification Gateway Configuration
 * In a production environment, these endpoints would point to serverless functions
 * that securely handle Twilio/SendGrid/Firebase credentials.
 */
const GATEWAY_CONFIG = {
  SMS_ENDPOINT: '/api/notify/sms',
  EMAIL_ENDPOINT: '/api/notify/email',
  PUSH_ENDPOINT: '/api/notify/push',
  USE_REAL_FETCH: false, // Set to true to attempt real HTTP requests to the endpoints above
};

/**
 * Requests permission from the user to send browser push notifications.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('[NOTIF] Browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Sends an SMS through the Twilio-ready backend gateway.
 */
const sendSMSViaTwilio = async (to: string, message: string): Promise<boolean> => {
  console.log(`[TWILIO GATEWAY] Dispatching SMS to: ${to}`);
  
  if (GATEWAY_CONFIG.USE_REAL_FETCH) {
    try {
      const response = await fetch(GATEWAY_CONFIG.SMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message }),
      });
      return response.ok;
    } catch (error) {
      console.error('[TWILIO ERROR] SMS delivery failed:', error);
      return false;
    }
  }

  // Simulation: 98% success rate for local testing
  await new Promise(resolve => setTimeout(resolve, 600));
  return Math.random() > 0.02;
};

/**
 * Main dispatcher for all communication channels.
 * Integrates browser Push, Twilio-powered SMS, and Email.
 */
export const dispatchToGateway = async (
  channel: 'SMS' | 'EMAIL' | 'PUSH' | 'SYSTEM',
  recipient: string,
  message: string
): Promise<{ status: 'Sent' | 'Failed'; gatewayId: string }> => {
  const gatewayId = `GW-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  let success = false;

  console.log(`[GATEWAY] Routing ${channel} via ID ${gatewayId}`);

  switch (channel) {
    case 'SMS':
      success = await sendSMSViaTwilio(recipient, message);
      break;

    case 'PUSH':
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('CivicFlow Update', {
            body: message,
            icon: '/favicon.ico',
            tag: 'civicflow-update',
            renotify: true,
            silent: false,
          } as any);
          success = true;
        } catch (e) {
          console.error('[PUSH ERROR] Browser rejected notification:', e);
          success = false;
        }
      }
      break;

    case 'EMAIL':
      // Simulation for Email (similar to SMS logic)
      await new Promise(resolve => setTimeout(resolve, 800));
      success = Math.random() > 0.01;
      break;

    case 'SYSTEM':
      success = true; // System internal messages always "succeed"
      break;

    default:
      success = false;
  }

  return {
    status: success ? 'Sent' : 'Failed',
    gatewayId
  };
};
