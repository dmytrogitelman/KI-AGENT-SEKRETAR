import axios from 'axios';
import { config } from '../../utils/env';
import { logger } from '../../utils/logger';

export class ElevenLabsTTS {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = config.ELEVENLABS_API_KEY || '';
  }

  async synthesize(text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM'): Promise<Buffer> {
    try {
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          responseType: 'arraybuffer',
        }
      );

      logger.info('ElevenLabs TTS synthesis completed', {
        textLength: text.length,
        audioSize: response.data.length,
      });

      return Buffer.from(response.data);
    } catch (error) {
      logger.error('ElevenLabs TTS synthesis failed', { error, text });
      throw error;
    }
  }

  async getVoices(): Promise<any[]> {
    try {
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data.voices;
    } catch (error) {
      logger.error('Failed to get ElevenLabs voices', { error });
      return [];
    }
  }
}





