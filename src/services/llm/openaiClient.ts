import { OpenAI } from 'openai';
import { config } from '../../utils/env';
import { logger } from '../../utils/logger';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  async generateResponse(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      logger.info('OpenAI response generated', {
        prompt: prompt.substring(0, 100),
        responseLength: content.length,
      });

      return content;
    } catch (error) {
      logger.error('Failed to generate OpenAI response', { error, prompt });
      throw error;
    }
  }

  async classifyIntent(message: string, language: string = 'en'): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    try {
      const systemPrompt = `You are an AI assistant that classifies user intents. 
      Analyze the message and determine the primary intent and extract relevant entities.
      
      Available intents:
      - calendar: Schedule, check, or modify calendar events
      - email: Read, compose, or manage emails
      - task: Create, update, or manage tasks
      - note: Create or retrieve notes
      - contact: Manage contacts
      - reminder: Set reminders
      - information: General information requests
      - greeting: Greetings and small talk
      - help: Help requests
      
      Respond with a JSON object containing:
      - intent: the primary intent
      - confidence: confidence score (0-1)
      - entities: extracted entities (dates, times, people, etc.)
      
      Language: ${language}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      try {
        const result = JSON.parse(content);
        logger.info('Intent classified', { intent: result.intent, confidence: result.confidence });
        return result;
      } catch (parseError) {
        logger.warn('Failed to parse intent classification', { content });
        return {
          intent: 'information',
          confidence: 0.5,
          entities: {},
        };
      }
    } catch (error) {
      logger.error('Failed to classify intent', { error, message });
      return {
        intent: 'information',
        confidence: 0.5,
        entities: {},
      };
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Detect the language of the following text and respond with only the ISO 639-1 language code (e.g., en, de, ru, zh).',
          },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 10,
      });

      const language = response.choices[0]?.message?.content?.trim();
      return language || 'en';
    } catch (error) {
      logger.error('Failed to detect language', { error, text });
      return 'en';
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Translate the following text to ${targetLanguage}. Maintain the original tone and context.`,
          },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const translated = response.choices[0]?.message?.content;
      if (!translated) {
        throw new Error('No translation from OpenAI');
      }

      return translated;
    } catch (error) {
      logger.error('Failed to translate text', { error, text, targetLanguage });
      return text; // Return original text if translation fails
    }
  }
}





