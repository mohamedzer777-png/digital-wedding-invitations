import type { Request, Response } from 'express';
import { adminService } from './admin.service.js';
import type { ListUsersQuery, UpdateUserInput, CreatePlanInput, UpdatePlanInput, ListMessagesQuery } from './admin.schema.js';

export const adminController = {
  async listUsers(req: Request, res: Response) {
    const query = req.query as unknown as ListUsersQuery;
    const result = await adminService.listUsers(query);
    res.json(result);
  },

  async updateUser(req: Request, res: Response) {
    const input = req.body as UpdateUserInput;
    const user = await adminService.updateUser(req.params.userId!, input);
    res.json(user);
  },

  async listPlans(_req: Request, res: Response) {
    res.json({ items: await adminService.listPlans() });
  },

  async createPlan(req: Request, res: Response) {
    const input = req.body as CreatePlanInput;
    const plan = await adminService.createPlan(input);
    res.status(201).json(plan);
  },

  async updatePlan(req: Request, res: Response) {
    const input = req.body as UpdatePlanInput;
    const plan = await adminService.updatePlan(req.params.planId!, input);
    res.json(plan);
  },

  async listTemplates(_req: Request, res: Response) {
    res.json({ items: await adminService.listTemplates() });
  },

  async listMessages(req: Request, res: Response) {
    const query = req.query as unknown as ListMessagesQuery;
    const result = await adminService.listMessages(query);
    res.json(result);
  },

  async analytics(_req: Request, res: Response) {
    res.json(await adminService.systemAnalytics());
  },
};
