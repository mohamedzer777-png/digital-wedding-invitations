import type { Request, Response } from 'express';
import { webhooksService } from './webhooks.service.js';

export const webhooksController = {
  async verify(req: Request, res: Response) {
    const challenge = webhooksService.verify(req.query as Record<string, string | undefined>);
    res.send(challenge);
  },

  async receive(req: Request, res: Response) {
    const rawBody = req.body as Buffer;
    await webhooksService.receive(rawBody, req.headers['x-hub-signature-256'] as string | undefined);
    res.json({ success: true });
  },
};
