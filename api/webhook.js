/**
 * Vercel Node.js Serverless Function
 * URL: /api/webhook   (Vercel подхватит автоматически)
 */
module.exports = async (req, res) => {
  // --- GET: verify (на будущее, если понадобится)
  if (req.method === 'GET') {
    const mode = String(req.query['hub.mode'] || '');
    const token = String(req.query['hub.verify_token'] || '');
    const challenge = String(req.query['hub.challenge'] || '');
    const expected = process.env.WHATSAPP_VERIFY_TOKEN || '';

    if (mode === 'subscribe' && token && expected && token === expected) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // --- POST: входящие сообщения (из формы или JSON)
  const body = typeof req.body === 'string'
    ? Object.fromEntries(new URLSearchParams(req.body))
    : (req.body || {});

  const From = body.From || body.from;
  const To   = body.To   || body.to;
  const Text = body.Body || body.body;
  const NumMedia = Number(body.NumMedia || 0);

  const media = [];
  for (let i = 0; i < NumMedia; i++) {
    const url = body[`MediaUrl${i}`];
    const ct  = body[`MediaContentType${i}`];
    if (url) media.push({ url, contentType: ct });
  }

  console.log('[WA INCOMING]', { From, To, Text, NumMedia, media });

  return res.status(200).send('OK');
};
