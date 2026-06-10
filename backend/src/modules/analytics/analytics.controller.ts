import type { Request, Response } from 'express';
import { analyticsService } from './analytics.service.js';
import { analyticsTimelineQuery } from './analytics.schema.js';
import { getTenantId } from '../../middleware/tenant.js';

export const analyticsController = {
  async summary(req: Request, res: Response) {
    const data = await analyticsService.summary(getTenantId(req), req.params.eventId!);
    res.json(data);
  },

  async timeline(req: Request, res: Response) {
    const query = analyticsTimelineQuery.parse(req.query);
    const data = await analyticsService.timeline(getTenantId(req), req.params.eventId!, query);
    res.json(data);
  },
};
