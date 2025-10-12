import type { VercelRequest, VercelResponse } from '@vercel/node';

// Лёгкий health/status без зависимостей на Prisma/Redis/Express
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  // Можно добавить простые проверки окружения (без секретов)
  const now = new Date().toISOString();
  const uptime = process.uptime();

  return res.status(200).json({
    ok: true,
    service: 'KI Agent Sekretar (status)',
    timestamp: now,
    uptime,
    node: process.versions.node,
    region: process.env.VERCEL_REGION || 'unknown',
  });
}

