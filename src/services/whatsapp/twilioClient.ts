import twilio from 'twilio';
import { config } from '../../utils/env';
import { logger } from '../../utils/logger';
import { OpenAI } from 'openai';

export class WhatsAppService {
  private client: twilio.Twilio;
  private openai: OpenAI;

  constructor() {
    this.client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  async sendMessage(to: string, message: string): Promise<void> {
    try {
      const result = await this.client.messages.create({
        from: config.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${to}`,
        body: message,
      });

      logger.info('Message sent successfully', {
        to,
        messageId: result.sid,
        status: result.status,
      });
    } catch (error) {
      logger.error('Failed to send WhatsApp message', { error, to, message });
      throw error;
    }
  }

  async sendAudioMessage(to: string, audioUrl: string): Promise<void> {
    try {
      const result = await this.client.messages.create({
        from: config.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${to}`,
        mediaUrl: [audioUrl],
      });

      logger.info('Audio message sent successfully', {
        to,
        messageId: result.sid,
        status: result.status,
      });
    } catch (error) {
      logger.error('Failed to send WhatsApp audio message', { error, to, audioUrl });
      throw error;
    }
  }

  async downloadAndTranscribeAudio(audioId: string): Promise<string> {
    try {
      // Download audio from Twilio
      const mediaUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages/${audioId}/Media/${audioId}`;
      
      const response = await fetch(mediaUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      // Transcribe using OpenAI Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }),
        model: 'whisper-1',
        language: 'auto', // Auto-detect language
      });

      logger.info('Audio transcribed successfully', {
        audioId,
        transcription: transcription.text,
      });

      return transcription.text;
    } catch (error) {
      logger.error('Failed to transcribe audio', { error, audioId });
      throw error;
    }
  }

  async downloadMedia(mediaId: string): Promise<Buffer> {
    try {
      const mediaUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages/${mediaId}/Media/${mediaId}`;
      
      const response = await fetch(mediaUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      logger.error('Failed to download media', { error, mediaId });
      throw error;
    }
  }
}



