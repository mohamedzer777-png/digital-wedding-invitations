import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email().max(255).trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  name: z.string().min(1).max(150).trim(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255).trim().toLowerCase(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
