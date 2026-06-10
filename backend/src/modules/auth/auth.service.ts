import crypto from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getTokenExpiry,
} from '../../lib/jwt.js';
import { Role, UserStatus } from '../../lib/enums.js';
import type { SignupInput, LoginInput } from './auth.schema.js';

/** Public-safe shape of a user (never expose passwordHash). */
const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Issues an access+refresh pair and persists the refresh token's hash. */
async function issueTokens(user: { id: string; email: string; role: string }) {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role as Role,
  });
  const refreshToken = signRefreshToken({ sub: user.id });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: getTokenExpiry(refreshToken),
    },
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async signup(input: SignupInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict('Email is already registered');

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: Role.USER,
        status: UserStatus.ACTIVE,
      },
      select: userSelect,
    });

    // Attach the Free plan if it has been seeded (non-fatal if absent).
    const freePlan = await prisma.plan.findUnique({ where: { name: 'Free' } });
    if (freePlan) {
      await prisma.subscription.create({
        data: { userId: user.id, planId: freePlan.id, status: 'TRIALING' },
      });
    }

    const tokens = await issueTokens(user);
    return { user, ...tokens };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Constant-ish message to avoid leaking which part failed.
    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (user.status !== UserStatus.ACTIVE) throw ApiError.forbidden('Account is suspended');

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw ApiError.unauthorized('Invalid email or password');

    const tokens = await issueTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = sha256(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.userId !== payload.sub) {
      throw ApiError.unauthorized('Refresh token not recognized');
    }
    if (stored.revokedAt) {
      // Reuse of a revoked token — revoke the whole family as a safety measure.
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw ApiError.unauthorized('Refresh token already used');
    }
    if (stored.expiresAt < new Date()) throw ApiError.unauthorized('Refresh token expired');

    const user = await prisma.user.findUnique({ where: { id: stored.userId }, select: userSelect });
    if (!user || user.status !== UserStatus.ACTIVE) throw ApiError.unauthorized();

    // Rotate: revoke old, issue new.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const tokens = await issueTokens(user);
    return { user, ...tokens };
  },

  async logout(refreshToken: string) {
    const tokenHash = sha256(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelect,
        subscription: { include: { plan: true } },
      },
    });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },
};
