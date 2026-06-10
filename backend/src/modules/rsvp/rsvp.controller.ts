import type { Request, Response } from 'express';
import { rsvpService } from './rsvp.service.js';

export const rsvpController = {
  async get(req: Request, res: Response) {
    const data = await rsvpService.getByToken(req.params.token!);
    res.json(data);
  },

  async respond(req: Request, res: Response) {
    const data = await rsvpService.respond(req.params.token!, req.body);
    res.json(data);
  },
};
