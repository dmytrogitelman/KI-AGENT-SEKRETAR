import axios from 'axios';
import { config } from '../../utils/env';
import { logger } from '../../utils/logger';

export class AzureTTS {
  private apiKey: string;
  private region: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.AZURE_TTS_KEY || '';
    this.region = config.AZURE_TTS_REGION || '';
    this.baseUrl = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  }

  async synthesize(text: string, voice: string = 'en-US-AriaNeural'): Promise<Buffer> {
    try {
      if (!this.apiKey || !this.region) {
        throw new Error('Azure TTS credentials not configured');
      }

      const ssml = `
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
          <voice name='${voice}'>
            ${text}
          </voice>
        </speak>
      `;

      const response = await axios.post(this.baseUrl, ssml, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        },
        responseType: 'arraybuffer',
      });

      logger.info('Azure TTS synthesis completed', {
        textLength: text.length,
        audioSize: response.data.length,
        voice,
      });

      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Azure TTS synthesis failed', { error, text, voice });
      throw error;
    }
  }

  async getVoices(): Promise<any[]> {
    try {
      if (!this.apiKey || !this.region) {
        throw new Error('Azure TTS credentials not configured');
      }

      const response = await axios.get(
        `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get Azure voices', { error });
      return [];
    }
  }
}





