import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Ленивая инициализация Prisma, безопасная для сред без БД.
 * Не создаём клиента, если нет DATABASE_URL.
 */
let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!process.env['DATABASE_URL']) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });
    
    // Log queries in development
    if (process.env['NODE_ENV'] === 'development') {
      (prisma as any).$on('query', (e: any) => {
        logger.debug('Query: ' + e.query);
        logger.debug('Params: ' + e.params);
        logger.debug('Duration: ' + e.duration + 'ms');
      });
    }
  }
  return prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

export default prisma;

