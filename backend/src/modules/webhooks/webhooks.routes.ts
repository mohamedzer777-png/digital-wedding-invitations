import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { webhooksController } from './webhooks.controller.js';

// PUBLIC router — verified by provider signature / verify token, not JWT.
export const webhooksRouter = Router();

// WhatsApp Cloud API verification handshake (GET) + event callbacks (POST).
webhooksRouter.get('/whatsapp', asyncHandler(webhooksController.verify));
webhooksRouter.post('/whatsapp', asyncHandler(webhooksController.receive));
