import { ElevenLabsTTS } from './elevenlabs';
import { AzureTTS } from './azure';
import { logger } from '../../utils/logger';

export class TTSService {
  private elevenLabs: ElevenLabsTTS;
  private azure: AzureTTS;
  private primaryProvider: 'elevenlabs' | 'azure';

  constructor() {
    this.elevenLabs = new ElevenLabsTTS();
    this.azure = new AzureTTS();
    this.primaryProvider = 'elevenlabs'; // Default to ElevenLabs
  }

  async synthesize(text: string, language: string = 'en'): Promise<Buffer> {
    try {
      // Try primary provider first
      if (this.primaryProvider === 'elevenlabs') {
        try {
          return await this.elevenLabs.synthesize(text);
        } catch (error) {
          logger.warn('ElevenLabs TTS failed, falling back to Azure', { error });
          this.primaryProvider = 'azure';
        }
      }

      // Try Azure TTS
      try {
        const voice = this.getVoiceForLanguage(language);
        return await this.azure.synthesize(text, voice);
      } catch (error) {
        logger.error('Both TTS providers failed', { error });
        throw new Error('TTS synthesis failed');
      }
    } catch (error) {
      logger.error('TTS synthesis failed', { error, text, language });
      throw error;
    }
  }

  private getVoiceForLanguage(language: string): string {
    const voiceMap: Record<string, string> = {
      'en': 'en-US-AriaNeural',
      'de': 'de-DE-KatjaNeural',
      'ru': 'ru-RU-SvetlanaNeural',
      'zh': 'zh-CN-XiaoxiaoNeural',
      'es': 'es-ES-ElviraNeural',
      'fr': 'fr-FR-DeniseNeural',
      'it': 'it-IT-ElsaNeural',
      'pt': 'pt-BR-FranciscaNeural',
      'ja': 'ja-JP-NanamiNeural',
      'ko': 'ko-KR-SunHiNeural',
    };

    return voiceMap[language] || 'en-US-AriaNeural';
  }

  async getAvailableVoices(): Promise<any[]> {
    try {
      if (this.primaryProvider === 'elevenlabs') {
        return await this.elevenLabs.getVoices();
      } else {
        return await this.azure.getVoices();
      }
    } catch (error) {
      logger.error('Failed to get available voices', { error });
      return [];
    }
  }
}





