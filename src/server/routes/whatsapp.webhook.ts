import { Router, Request, Response } from 'express';
import twilio from 'twilio';

const whatsappRouter = Router();

const hasTwilioCreds =
  !!process.env.TWILIO_ACCOUNT_SID &&
  !!process.env.TWILIO_AUTH_TOKEN &&
  !!process.env.TWILIO_WHATSAPP_NUMBER;

const twilioClient = hasTwilioCreds
  ? twilio(process.env.TWILIO_ACCOUNT_SID as string, process.env.TWILIO_AUTH_TOKEN as string)
  : null;

// === GET /webhook/whatsapp — verify (если нужно) ===
whatsappRouter.get('/webhook/whatsapp', (req: Request, res: Response) => {
  const mode = String(req.query['hub.mode'] || '');
  const token = String(req.query['hub.verify_token'] || '');
  const challenge = String(req.query['hub.challenge'] || '');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN || '';
  if (mode === 'subscribe' && token && expected && token === expected) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden');
});

// === POST /webhook/whatsapp — основной обработчик ===
whatsappRouter.post('/webhook/whatsapp', async (req: Request, res: Response) => {
  const { From, Body, NumMedia = '0' } = req.body || {};
  const mediaCount = Number(NumMedia || '0');

  console.log('[WA INCOMING]', { from: From, body: Body, mediaCount });

  // 1) Сразу подтверждаем Twilio корректным TwiML
  try {
    const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
    if (isTest) {
      res.status(200).type('text/plain').send('OK');
    } else {
      res.status(200).type('text/xml').send('<Response></Response>');
    }
  } catch (e) {
    console.error('[WEBHOOK RESP ERROR]', e);
    return;
  }

  // 2) Определяем текст пользователя
  let userText = Body || '';

  // Если пришло аудио — скачиваем и распознаём Whisper
  if (mediaCount > 0) {
    const ct = (req.body as any)['MediaContentType0'] as string;
    const url = (req.body as any)['MediaUrl0'] as string;
    if (ct && ct.startsWith('audio') && url) {
      try {
        const { downloadTwilioMedia } = await import('../../services/whatsapp/media');
        const audioPath = await downloadTwilioMedia(url, 'wa-audio');
        console.log('[AUDIO SAVED]', audioPath);

        const { transcribeAudio } = await import('../../services/stt/openai');
        userText = await transcribeAudio(audioPath);
        console.log('[STT TEXT]', userText);
      } catch (err) {
        console.error('[STT ERROR]', err);
      }
    }
  }

  // 3) Подключаем AI-оркестратор
  let replyText = 'Сообщение получено.';
  let shouldUseTTS = false;
  
  if (userText && userText.trim().length > 0) {
    try {
      const { processMessage } = await import('../../ai/orchestrator');
      const userId = (From || '').replace('whatsapp:', '') || 'anon';
      const orchestratorResponse = await processMessage(userId, userText.trim());
      
      replyText = orchestratorResponse.text || 'Готово.';
      shouldUseTTS = orchestratorResponse.tts || false;
      
      console.log('[ORCHESTRATOR RESPONSE]', {
        userId,
        originalText: userText,
        response: replyText,
        tts: shouldUseTTS,
        metadata: orchestratorResponse.metadata
      });
    } catch (err) {
      console.error('[ORCHESTRATOR ERROR]', err);
      replyText = 'Извините, произошла ошибка при обработке сообщения. Попробуйте еще раз.';
      shouldUseTTS = true;
    }
  }

  // 4) Асинхронная отправка ответа в WhatsApp
  if (twilioClient && From && process.env.TWILIO_WHATSAPP_NUMBER) {
    try {
      // 4.1 Текст
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER!,
        to: From,
        body: replyText,
      });
      console.log('[WA OUT TEXT] sent');

      // 4.2 TTS через ElevenLabs (если ключ есть и оркестратор рекомендует)
      if (process.env.ELEVENLABS_API_KEY && shouldUseTTS) {
        const { ttsElevenLabs } = await import('../../services/tts/eleven');
        try {
          const audioOut = await ttsElevenLabs(replyText, 'reply');
          const fname = audioOut.split(/[/\\]/).pop()!;
          const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
          if (!base) {
            console.warn('PUBLIC_BASE_URL не задан! Укажи, например: https://<твой-ngrok>.ngrok-free.app');
          } else {
            const publicUrl = `${base}/media/${fname}`;
            await twilioClient.messages.create({
              from: process.env.TWILIO_WHATSAPP_NUMBER!,
              to: From,
              body: '(Голосовой ответ)',
              mediaUrl: [ publicUrl ],
            });
            console.log('[WA OUT VOICE] sent', publicUrl);
          }
        } catch (e) {
          console.error('[TTS ERROR]', e);
        }
      }
    } catch (err) {
      console.error('[WA OUT ERROR]', err);
    }
  } else {
    console.warn('[WA OUT SKIP] Missing Twilio creds or From');
  }
});

export default whatsappRouter;
