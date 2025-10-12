import Twilio from 'twilio';

const ACCOUNT_SID = process.env['TWILIO_ACCOUNT_SID'];
const AUTH_TOKEN = process.env['TWILIO_AUTH_TOKEN'];
const FROM = process.env['TWILIO_WHATSAPP_NUMBER']; // например, "whatsapp:+14155238886" или твоё prod-число

if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM) {
  // Не бросаем ошибку на старте — просто логируем; отправка попробует и словит исключение
  console.warn('[Twilio] Missing env vars: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_NUMBER');
}

const client = ACCOUNT_SID && AUTH_TOKEN ? Twilio(ACCOUNT_SID, AUTH_TOKEN) : null;

export async function sendTextMessage(to: string, body: string) {
  if (!client || !FROM) throw new Error('Twilio client is not configured');
  return client.messages.create({
    from: FROM,
    to,
    body
  });
}

export async function sendMediaMessage(to: string, body: string, mediaUrl: string) {
  if (!client || !FROM) throw new Error('Twilio client is not configured');
  return client.messages.create({
    from: FROM,
    to,
    body,
    mediaUrl: [mediaUrl]
  });
}
