import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { templateController } from './templates.controller.js';
import { createTemplateSchema } from './templates.schema.js';

export const templatesRouter = Router();

templatesRouter.use(authenticate);

templatesRouter.get('/', asyncHandler(templateController.list));
templatesRouter.post('/', validate({ body: createTemplateSchema }), asyncHandler(templateController.create));
templatesRouter.get('/:templateId', asyncHandler(templateController.get));
