import { OpenAIService } from '../llm/openaiClient';
import { logger } from '../../utils/logger';

export interface LanguageDetection {
  language: string;
  confidence: number;
  isReliable: boolean;
}

export class LanguageDetector {
  private openai: OpenAIService;

  constructor() {
    this.openai = new OpenAIService();
  }

  async detectLanguage(text: string): Promise<LanguageDetection> {
    try {
      const language = await this.openai.detectLanguage(text);
      
      // Map common language codes to full names
      const languageMap: Record<string, string> = {
        'en': 'English',
        'de': 'Deutsch',
        'ru': 'Русский',
        'zh': '中文',
        'es': 'Español',
        'fr': 'Français',
        'it': 'Italiano',
        'pt': 'Português',
        'ja': '日本語',
        'ko': '한국어',
      };

      const fullLanguage = languageMap[language] || language;
      
      return {
        language: fullLanguage,
        confidence: 0.9, // OpenAI detection is generally reliable
        isReliable: true,
      };
    } catch (error) {
      logger.error('Language detection failed', { error, text });
      return {
        language: 'English',
        confidence: 0.5,
        isReliable: false,
      };
    }
  }

  async detectMultipleLanguages(texts: string[]): Promise<LanguageDetection[]> {
    try {
      const results: LanguageDetection[] = [];
      
      for (const text of texts) {
        const detection = await this.detectLanguage(text);
        results.push(detection);
      }

      logger.info('Multiple languages detected', {
        count: results.length,
        languages: results.map(r => r.language),
      });

      return results;
    } catch (error) {
      logger.error('Multiple language detection failed', { error, textCount: texts.length });
      return texts.map(() => ({
        language: 'English',
        confidence: 0.5,
        isReliable: false,
      }));
    }
  }
}





