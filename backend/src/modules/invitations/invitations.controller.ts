import type { Request, Response } from 'express';
import { invitationService } from './invitations.service.js';
import { getTenantId } from '../../middleware/tenant.js';
import { logger } from '../../lib/logger.js';

export const invitationController = {
  async get(req: Request, res: Response) {
    const inv = await invitationService.get(getTenantId(req), req.params.eventId!);
    res.json(inv);
  },

  async save(req: Request, res: Response) {
    logger.info({ body: req.body }, 'Saving invitation payload');
    const inv = await invitationService.save(getTenantId(req), req.params.eventId!, req.body);
    res.json(inv);
  },
};
