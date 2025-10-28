import type { VercelRequest, VercelResponse } from '@vercel/node';

// Универсальный парсер тела: поддержка JSON и application/x-www-form-urlencoded
function parseBody(req: VercelRequest): Record<string, any> {
  const b: any = req.body ?? {};
  if (typeof b === 'string') {
    try {
      return Object.fromEntries(new URLSearchParams(b));
    } catch {
      return {};
    }
  }
  return b;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- GET: верификация (если нужна) ---
  if (req.method === 'GET') {
    const mode = String((req.query['hub.mode'] ?? '') as string);
    const token = String((req.query['hub.verify_token'] ?? '') as string);
    const challenge = String((req.query['hub.challenge'] ?? '') as string);
    const expected = process.env['WHATSAPP_VERIFY_TOKEN'] ?? '';

    if (mode === 'subscribe' && token && expected && token === expected) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // --- POST: входящее сообщение ---
  if (req.method === 'POST') {
    const body = parseBody(req);

    const From = body.From || body.from;
    const To = body.To || body.to;
    const Text = body.Body || body.body;
    const NumMedia = Number(body.NumMedia || 0);

    const media: Array<{ url: string; contentType?: string }> = [];
    for (let i = 0; i < NumMedia; i++) {
      const url = body[`MediaUrl${i}`];
      const ct = body[`MediaContentType${i}`];
      if (url) media.push({ url, contentType: ct });
    }

    console.log('[WA INCOMING]', { From, To, Text, NumMedia, media });

    // Здесь позже можно вызвать ваш Orchestrator и отправку ответа через Twilio REST.
    // Для проверки сейчас — мгновенный ответ 200 OK:
    return res.status(200).send('OK');
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).send('Method Not Allowed');
}
