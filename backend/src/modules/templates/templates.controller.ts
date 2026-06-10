import type { Request, Response } from 'express';
import { templateService } from './templates.service.js';
import { getTenantId } from '../../middleware/tenant.js';

export const templateController = {
  async list(req: Request, res: Response) {
    const items = await templateService.list(getTenantId(req));
    res.json({ items });
  },

  async create(req: Request, res: Response) {
    const tpl = await templateService.create(getTenantId(req), req.body);
    res.status(201).json(tpl);
  },

  async get(req: Request, res: Response) {
    const tpl = await templateService.get(getTenantId(req), req.params.templateId!);
    res.json(tpl);
  },
};
