import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { adminController } from './admin.controller.js';
import { listUsersQuery, updateUserSchema, createPlanSchema, updatePlanSchema, listMessagesQuery } from './admin.schema.js';

export const adminRouter = Router();

// Admin-only: bypasses tenant scoping via dedicated, role-guarded routes.
adminRouter.use(authenticate, requireRole('ADMIN'));

adminRouter.get('/users', validate({ query: listUsersQuery }), asyncHandler(adminController.listUsers));
adminRouter.patch('/users/:userId', validate({ body: updateUserSchema }), asyncHandler(adminController.updateUser));

adminRouter.get('/plans', asyncHandler(adminController.listPlans));
adminRouter.post('/plans', validate({ body: createPlanSchema }), asyncHandler(adminController.createPlan));
adminRouter.patch('/plans/:planId', validate({ body: updatePlanSchema }), asyncHandler(adminController.updatePlan));

adminRouter.get('/templates', asyncHandler(adminController.listTemplates));
adminRouter.get('/messages', validate({ query: listMessagesQuery }), asyncHandler(adminController.listMessages));
adminRouter.get('/analytics', asyncHandler(adminController.analytics));
