import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Простой health/status эндпойнт без импорта Prisma,
 * чтобы не падать на Vercel, даже если БД недоступна.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    hasDbUrl: Boolean(process.env.DATABASE_URL),
    version: process.env.npm_package_version || '1.0.0'
  });
}
