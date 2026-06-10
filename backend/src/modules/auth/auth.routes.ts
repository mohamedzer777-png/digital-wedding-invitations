import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { authController } from './auth.controller.js';
import { loginSchema, refreshSchema, signupSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/signup', authLimiter, validate({ body: signupSchema }), asyncHandler(authController.signup));
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(authController.login));
authRouter.post('/refresh', authLimiter, validate({ body: refreshSchema }), asyncHandler(authController.refresh));
authRouter.post('/logout', validate({ body: refreshSchema }), asyncHandler(authController.logout));
authRouter.get('/me', authenticate, asyncHandler(authController.me));
