import { LanguageDetector, LanguageDetection } from './languageDetector';
import { Translator, Translation } from './translator';
import { logger } from '../../utils/logger';

export interface I18nResult {
  originalText: string;
  detectedLanguage: LanguageDetection;
  translatedText?: string;
  translation?: Translation;
  userLanguage: string;
  needsTranslation: boolean;
}

export class I18nService {
  private languageDetector: LanguageDetector;
  private translator: Translator;

  constructor() {
    this.languageDetector = new LanguageDetector();
    this.translator = new Translator();
  }

  async processText(text: string, userLanguage: string = 'en'): Promise<I18nResult> {
    try {
      // Detect language
      const detectedLanguage = await this.languageDetector.detectLanguage(text);
      
      // Check if translation is needed
      const needsTranslation = detectedLanguage.language !== userLanguage;
      
      let translatedText: string | undefined;
      let translation: Translation | undefined;

      if (needsTranslation) {
        // Translate to user language
        translatedText = await this.translator.translateToUserLanguage(text, userLanguage);
        translation = {
          text: translatedText,
          sourceLanguage: detectedLanguage.language,
          targetLanguage: userLanguage,
          confidence: 0.9,
        };
      }

      const result: I18nResult = {
        originalText: text,
        detectedLanguage,
        translatedText: translatedText || text,
        translation,
        userLanguage,
        needsTranslation,
      };

      logger.info('Text processed for i18n', {
        originalLength: text.length,
        detectedLanguage: detectedLanguage.language,
        userLanguage,
        needsTranslation,
        translatedLength: translatedText?.length,
      });

      return result;
    } catch (error) {
      logger.error('I18n processing failed', { error, text, userLanguage });
      
      // Return fallback result
      return {
        originalText: text,
        detectedLanguage: {
          language: 'English',
          confidence: 0.5,
          isReliable: false,
        },
        userLanguage,
        needsTranslation: false,
      };
    }
  }

  async processMultipleTexts(texts: string[], userLanguage: string = 'en'): Promise<I18nResult[]> {
    try {
      const results: I18nResult[] = [];
      
      for (const text of texts) {
        const result = await this.processText(text, userLanguage);
        results.push(result);
      }

      logger.info('Multiple texts processed for i18n', {
        count: results.length,
        userLanguage,
        translationsNeeded: results.filter(r => r.needsTranslation).length,
      });

      return results;
    } catch (error) {
      logger.error('Multiple i18n processing failed', { error, textCount: texts.length, userLanguage });
      throw error;
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    return await this.translator.getSupportedLanguages();
  }

  async isLanguageSupported(language: string): Promise<boolean> {
    return await this.translator.isLanguageSupported(language);
  }

  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<Translation> {
    return await this.translator.translateText(text, targetLanguage, sourceLanguage);
  }

  async detectLanguage(text: string): Promise<LanguageDetection> {
    return await this.languageDetector.detectLanguage(text);
  }
}





