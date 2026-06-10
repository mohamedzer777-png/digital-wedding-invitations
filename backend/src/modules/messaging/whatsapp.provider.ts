import { nanoid } from 'nanoid';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

export interface SendResult {
  providerMsgId: string;
}

export interface WhatsAppProvider {
  sendText(to: string, body: string): Promise<SendResult>;
}

class MockWhatsAppProvider implements WhatsAppProvider {
  async sendText(to: string, body: string): Promise<SendResult> {
    logger.info({ to, preview: body.slice(0, 80) }, '[mock WhatsApp] message sent');
    return { providerMsgId: `mock_${nanoid(20)}` };
  }
}

class CloudWhatsAppProvider implements WhatsAppProvider {
  async sendText(to: string, body: string): Promise<SendResult> {
    if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error('WhatsApp Cloud API is not configured');
    }

    const url = `https://graph.facebook.com/v17.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });

    const payload = (await response.json()) as any;
    if (!response.ok) {
      logger.error({ status: response.status, payload }, 'WhatsApp Cloud API error');
      throw new Error(payload?.error?.message ?? 'WhatsApp Cloud API request failed');
    }

    const providerMsgId = payload?.messages?.[0]?.id ?? payload?.id;
    if (!providerMsgId) {
      logger.error({ payload }, 'WhatsApp Cloud API returned no message id');
      throw new Error('WhatsApp Cloud API returned no message id');
    }

    logger.info({ to, providerMsgId, preview: body.slice(0, 80) }, '[cloud WhatsApp] message sent');
    return { providerMsgId };
  }
}

export const whatsappProvider: WhatsAppProvider = env.WHATSAPP_PROVIDER === 'cloud' ? new CloudWhatsAppProvider() : new MockWhatsAppProvider();
