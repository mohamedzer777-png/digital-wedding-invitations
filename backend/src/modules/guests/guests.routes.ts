import { Router } from 'express';
import multer from 'multer';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { guestController } from './guests.controller.js';
import { createGuestSchema, updateGuestSchema } from './guests.schema.js';

// mergeParams: true so :eventId from the parent route is available.
export const guestsRouter = Router({ mergeParams: true });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

guestsRouter.get('/', asyncHandler(guestController.list)); // query validated in controller
guestsRouter.post('/', validate({ body: createGuestSchema }), asyncHandler(guestController.create));
guestsRouter.post('/import', upload.single('file'), asyncHandler(guestController.import));
guestsRouter.patch('/:guestId', validate({ body: updateGuestSchema }), asyncHandler(guestController.update));
guestsRouter.delete('/:guestId', asyncHandler(guestController.remove));
