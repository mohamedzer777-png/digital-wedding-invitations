import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { aiController } from './ai.controller.js';
import { generateTextSchema, improveTextSchema, suggestTemplateSchema } from './ai.schema.js';

export const aiRouter = Router();

aiRouter.use(authenticate);

aiRouter.post('/generate-text', validate({ body: generateTextSchema }), asyncHandler(aiController.generateText));
aiRouter.post('/improve-text', validate({ body: improveTextSchema }), asyncHandler(aiController.improveText));
aiRouter.post('/suggest-template', validate({ body: suggestTemplateSchema }), asyncHandler(aiController.suggestTemplate));
