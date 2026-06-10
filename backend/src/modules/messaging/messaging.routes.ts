import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { messagingController } from './messaging.controller.js';
import { scheduleSchema, sendSchema } from './messaging.schema.js';

export const messagingRouter = Router({ mergeParams: true });

messagingRouter.get('/', asyncHandler(messagingController.list)); // query validated in controller
messagingRouter.post('/send', validate({ body: sendSchema }), asyncHandler(messagingController.send));
messagingRouter.post('/schedule', validate({ body: scheduleSchema }), asyncHandler(messagingController.schedule));
messagingRouter.post('/:messageId/retry', asyncHandler(messagingController.retry));
