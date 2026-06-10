import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { getTenantId } from '../../middleware/tenant.js';

export const authController = {
  async signup(req: Request, res: Response) {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.json(result);
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  },

  async logout(req: Request, res: Response) {
    const result = await authService.logout(req.body.refreshToken);
    res.json(result);
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(getTenantId(req));
    res.json({ user });
  },
};
