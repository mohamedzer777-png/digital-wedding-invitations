import type { Request, Response } from 'express';
import { reminderService } from './reminders.service.js';
import { getTenantId } from '../../middleware/tenant.js';

export const reminderController = {
  async list(req: Request, res: Response) {
    const items = await reminderService.list(getTenantId(req), req.params.eventId!);
    res.json({ items });
  },

  async configure(req: Request, res: Response) {
    const items = await reminderService.configure(getTenantId(req), req.params.eventId!, req.body);
    res.json({ items });
  },
};
