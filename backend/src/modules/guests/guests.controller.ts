import type { Request, Response } from 'express';
import { guestService } from './guests.service.js';
import { getTenantId } from '../../middleware/tenant.js';
import { ApiError } from '../../lib/ApiError.js';
import { listGuestsQuery } from './guests.schema.js';

export const guestController = {
  async list(req: Request, res: Response) {
    const query = listGuestsQuery.parse(req.query);
    const result = await guestService.list(getTenantId(req), req.params.eventId!, query);
    res.json(result);
  },

  async create(req: Request, res: Response) {
    const guest = await guestService.create(getTenantId(req), req.params.eventId!, req.body);
    res.status(201).json(guest);
  },

  async import(req: Request, res: Response) {
    if (!req.file) throw ApiError.badRequest('CSV file is required (multipart field "file")');
    const result = await guestService.importCsv(getTenantId(req), req.params.eventId!, req.file.buffer);
    res.json(result);
  },

  async update(req: Request, res: Response) {
    const guest = await guestService.update(getTenantId(req), req.params.eventId!, req.params.guestId!, req.body);
    res.json(guest);
  },

  async remove(req: Request, res: Response) {
    const result = await guestService.remove(getTenantId(req), req.params.eventId!, req.params.guestId!);
    res.json(result);
  },
};
