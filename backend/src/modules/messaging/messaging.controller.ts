import type { Request, Response } from 'express';
import { messagingService } from './messaging.service.js';
import { getTenantId } from '../../middleware/tenant.js';
import { listMessagesQuery } from './messaging.schema.js';

export const messagingController = {
  async list(req: Request, res: Response) {
    const query = listMessagesQuery.parse(req.query);
    const result = await messagingService.list(getTenantId(req), req.params.eventId!, query);
    res.json(result);
  },

  async send(req: Request, res: Response) {
    const result = await messagingService.send(getTenantId(req), req.params.eventId!, req.body);
    res.json(result);
  },

  async schedule(req: Request, res: Response) {
    const result = await messagingService.schedule(getTenantId(req), req.params.eventId!, req.body);
    res.status(201).json(result);
  },

  async retry(req: Request, res: Response) {
    const result = await messagingService.retry(getTenantId(req), req.params.eventId!, req.params.messageId!);
    res.json(result);
  },
};
