import crypto from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/ApiError.js';
import { MessageStatus } from '../../lib/enums.js';

function verifySignature(rawBody: Buffer, signature?: string) {
  if (!env.WHATSAPP_APP_SECRET || !signature) return true;
  const expected = crypto
    .createHmac('sha256', env.WHATSAPP_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  return signature.includes(expected);
}

function mapWhatsAppStatus(status: string) {
  switch (status) {
    case 'sent':
      return MessageStatus.SENT;
    case 'delivered':
      return MessageStatus.DELIVERED;
    case 'read':
      return MessageStatus.READ;
    case 'failed':
    case 'undelivered':
      return MessageStatus.FAILED;
    default:
      return undefined;
  }
}

export const webhooksService = {
  verify(query: Record<string, string | undefined>) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN && typeof challenge === 'string') {
      return challenge;
    }
    throw ApiError.forbidden('Webhook verification failed');
  },

  async receive(rawBody: Buffer, signature?: string) {
    if (!verifySignature(rawBody, signature)) {
      throw ApiError.forbidden('Invalid webhook signature');
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw ApiError.badRequest('Invalid JSON payload');
    }

    if (payload.object !== 'whatsapp_business_account') return { success: true };

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        for (const status of value.statuses ?? []) {
          const providerMsgId = status.id || status.message_id;
          const mapped = mapWhatsAppStatus(status.status);
          if (providerMsgId && mapped) {
            await prisma.message.updateMany({
              where: { providerMsgId },
              data: {
                status: mapped,
                deliveredAt: mapped === MessageStatus.DELIVERED ? new Date() : undefined,
                readAt: mapped === MessageStatus.READ ? new Date() : undefined,
                error: mapped === MessageStatus.FAILED ? status.error?.message ?? String(status) : null,
              },
            });
          }
        }
      }
    }

    return { success: true };
  },
};
