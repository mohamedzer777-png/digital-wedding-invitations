import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { invitationController } from './invitations.controller.js';
import { saveInvitationSchema } from './invitations.schema.js';

export const invitationRouter = Router({ mergeParams: true });

invitationRouter.get('/', asyncHandler(invitationController.get));
invitationRouter.put('/', validate({ body: saveInvitationSchema }), asyncHandler(invitationController.save));
