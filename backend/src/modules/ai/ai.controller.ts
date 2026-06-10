import type { Request, Response } from 'express';
import { aiService } from './ai.service.js';
import { getTenantId } from '../../middleware/tenant.js';

export const aiController = {
  async generateText(req: Request, res: Response) {
    const result = await aiService.generateText(req.body);
    res.json(result);
  },

  async improveText(req: Request, res: Response) {
    const result = await aiService.improveText(req.body);
    res.json(result);
  },

  async suggestTemplate(req: Request, res: Response) {
    const result = await aiService.suggestTemplate(req.body);
    res.json(result);
  },
};
