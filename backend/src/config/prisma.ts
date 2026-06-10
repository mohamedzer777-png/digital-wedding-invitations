import { PrismaClient } from '@prisma/client';
import { isProd } from './env.js';

/**
 * Singleton PrismaClient. In dev, reuse the instance across hot reloads to
 * avoid exhausting database connections.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['error', 'warn', 'query'],
  });

if (!isProd) globalForPrisma.prisma = prisma;
