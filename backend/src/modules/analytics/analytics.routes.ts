import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { analyticsController } from './analytics.controller.js';
import { analyticsTimelineQuery } from './analytics.schema.js';

export const analyticsRouter = Router({ mergeParams: true });

analyticsRouter.get('/summary', asyncHandler(analyticsController.summary));
analyticsRouter.get('/timeline', validate({ query: analyticsTimelineQuery }), asyncHandler(analyticsController.timeline));
