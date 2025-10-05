import { OpenAIService } from '../llm/openaiClient';
import { logger } from '../../utils/logger';

export interface Translation {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export class Translator {
  private openai: OpenAIService;

  constructor() {
    this.openai = new OpenAIService();
  }

  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<Translation> {
    try {
      const translatedText = await this.openai.translateText(text, targetLanguage);
      
      // Detect source language if not provided
      let detectedSourceLanguage = sourceLanguage;
      if (!detectedSourceLanguage) {
        const sourceLang = await this.openai.detectLanguage(text);
        detectedSourceLanguage = sourceLang;
      }

      const translation: Translation = {
        text: translatedText,
        sourceLanguage: detectedSourceLanguage,
        targetLanguage,
        confidence: 0.9, // OpenAI translation is generally reliable
      };

      logger.info('Text translated', {
        sourceLanguage: detectedSourceLanguage,
        targetLanguage,
        textLength: text.length,
        translatedLength: translatedText.length,
      });

      return translation;
    } catch (error) {
      logger.error('Translation failed', { error, text, targetLanguage, sourceLanguage });
      throw error;
    }
  }

  async translateMultipleTexts(
    texts: string[], 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<Translation[]> {
    try {
      const translations: Translation[] = [];
      
      for (const text of texts) {
        const translation = await this.translateText(text, targetLanguage, sourceLanguage);
        translations.push(translation);
      }

      logger.info('Multiple texts translated', {
        count: translations.length,
        targetLanguage,
        sourceLanguage,
      });

      return translations;
    } catch (error) {
      logger.error('Multiple translation failed', { error, textCount: texts.length, targetLanguage });
      throw error;
    }
  }

  async translateToUserLanguage(text: string, userLanguage: string): Promise<string> {
    try {
      // Detect if text is already in user language
      const detectedLanguage = await this.openai.detectLanguage(text);
      
      if (detectedLanguage === userLanguage) {
        return text; // No translation needed
      }

      const translation = await this.translateText(text, userLanguage, detectedLanguage);
      return translation.text;
    } catch (error) {
      logger.error('Translation to user language failed', { error, text, userLanguage });
      return text; // Return original text if translation fails
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    return [
      'en', 'de', 'ru', 'zh', 'es', 'fr', 'it', 'pt', 'ja', 'ko',
      'ar', 'hi', 'th', 'vi', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
    ];
  }

  async isLanguageSupported(language: string): Promise<boolean> {
    const supportedLanguages = await this.getSupportedLanguages();
    return supportedLanguages.includes(language);
  }
}





