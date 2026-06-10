import type { Request, Response } from 'express';
import { eventService } from './events.service.js';
import { getTenantId } from '../../middleware/tenant.js';

export const eventController = {
  async list(req: Request, res: Response) {
    const events = await eventService.list(getTenantId(req), { status: req.query.status as string | undefined });
    res.json({ items: events });
  },

  async create(req: Request, res: Response) {
    const event = await eventService.create(getTenantId(req), req.body);
    res.status(201).json(event);
  },

  async get(req: Request, res: Response) {
    const event = await eventService.getById(getTenantId(req), req.params.eventId!);
    res.json(event);
  },

  async update(req: Request, res: Response) {
    const event = await eventService.update(getTenantId(req), req.params.eventId!, req.body);
    res.json(event);
  },

  async remove(req: Request, res: Response) {
    const result = await eventService.remove(getTenantId(req), req.params.eventId!);
    res.json(result);
  },
};
