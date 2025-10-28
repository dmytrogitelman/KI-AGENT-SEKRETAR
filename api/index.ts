// api/index.ts
// Single Vercel Serverless Function that handles:
//   - GET  /api/status
//   - GET  /api/webhook/whatsapp  (verification style: hub.mode / hub.verify_token / hub.challenge)
//   - POST /api/webhook/whatsapp  (x-www-form-urlencoded body from Twilio)
// Без Express/Prisma — максимально лёгкий хендлер, чтобы на Vercel не падать.

import type { VercelRequest, VercelResponse } from '@vercel/node';

function ok(res: VercelResponse, data: any) {
  res.status(200).setHeader('Content-Type', 'application/json').send(JSON.stringify(data));
}

function text(res: VercelResponse, code: number, body = 'OK') {
  res.status(code).setHeader('Content-Type', 'text/plain; charset=utf-8').send(body);
}

// Разбор x-www-form-urlencoded тела (Twilio по умолчанию присылает именно так)
async function parseFormBody(req: VercelRequest): Promise<Record<string, string>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8') || '';
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

function isPath(req: VercelRequest, target: string) {
  // На Vercel в req.url будет начинаться с /api/...
  // Сравниваем строгое начало пути (без query)
  const url = (req.url || '').split('?')[0] || '';
  return url === target;
}

function nowISO() {
  return new Date().toISOString();
}

// ===== Основной хендлер =====
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = (req.url || '').split('?')[0] || '';
  const method = (req.method || 'GET').toUpperCase();

  // --- 1) health/status
  if (method === 'GET' && isPath(req, '/api/status')) {
    return ok(res, {
      ok: true,
      service: 'KI Agent Sekretar (status)',
      timestamp: nowISO(),
      uptime: process.uptime(),
      node: process.versions.node,
      region: process.env.VERCEL_REGION || 'unknown',
    });
  }

  // --- 2) WhatsApp webhook verification (как просили тесты)
  // GET /api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
  if (method === 'GET' && isPath(req, '/api/webhook/whatsapp')) {
    const mode = String((req.query?.['hub.mode'] ?? '') as string);
    const token = String((req.query?.['hub.verify_token'] ?? '') as string);
    const challenge = String((req.query?.['hub.challenge'] ?? '') as string);
    const expected = process.env.WHATSAPP_VERIFY_TOKEN || '';

    if (mode === 'subscribe' && token && expected && token === expected) {
      // Возвращаем challenge 200 текстом
      return text(res, 200, challenge);
    }
    return text(res, 403, 'Forbidden');
  }

  // --- 3) WhatsApp webhook receive (Twilio -> ваш бэкенд)
  // POST /api/webhook/whatsapp  (Content-Type: application/x-www-form-urlencoded)
  if (method === 'POST' && isPath(req, '/api/webhook/whatsapp')) {
    const contentType = (req.headers['content-type'] || '').toLowerCase();

    let body: Record<string, any> = {};
    if (contentType.includes('application/x-www-form-urlencoded')) {
      body = await parseFormBody(req);
    } else if (contentType.includes('application/json')) {
      // Vercel уже распарсит JSON, но оставим fallback
      body = (req as any).body || {};
    } else {
      // Попробуем всё равно прочитать как форму (Twilio по умолчанию шлёт form)
      body = await parseFormBody(req);
    }

    const { From, To, Body = '', NumMedia = '0' } = body;

    // Соберём медиа, если было
    const mediaCount = Number(NumMedia || '0');
    const media: Array<{ url: string; contentType: string }> = [];
    for (let i = 0; i < mediaCount; i++) {
      const url = body[`MediaUrl${i}`];
      const contentType = body[`MediaContentType${i}`];
      if (url) media.push({ url, contentType });
    }

    // Лог для отладки в Vercel
    console.log('[WA INCOMING]', {
      from: From,
      to: To,
      body: Body,
      mediaCount,
      media,
      at: nowISO(),
    });

    // Тут мог бы быть ваш Orchestrator + отправка ответа через Twilio REST.
    // Для базовой проверки и для тестов — отвечаем 200 "OK".
    return text(res, 200, 'OK');
  }

  // --- Fallback 404
  return text(res, 404, 'Not Found');
}
