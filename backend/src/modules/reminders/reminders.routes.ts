import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { reminderController } from './reminders.controller.js';
import { configureRemindersSchema } from './reminders.schema.js';

export const remindersRouter = Router({ mergeParams: true });

remindersRouter.get('/', asyncHandler(reminderController.list));
remindersRouter.put('/', validate({ body: configureRemindersSchema }), asyncHandler(reminderController.configure));
