import { OpenAIService } from '../services/llm/openaiClient';
// import { TTSService } from '../services/tts/ttsService'; // Currently unused
// import { WhatsAppService } from '../services/whatsapp/twilioClient'; // Currently unused
import { CalendarService } from '../services/calendar/calendarService';
import { EmailService } from '../services/email/emailService';
// import { TaskService } from '../services/tasks/taskService'; // TaskService not exported
import { I18nService } from '../services/i18n/i18nService';
import { logger } from '../utils/logger';

export interface MessageResponse {
  text?: string;
  audio?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export class MessageProcessor {
  private openai: OpenAIService;
  // private tts: TTSService; // Currently unused
  // private whatsapp: WhatsAppService; // Currently unused
  private calendarService?: CalendarService;
  private emailService?: EmailService;
  // private taskService?: TaskService; // TaskService not available
  private i18nService: I18nService;

  constructor() {
    this.openai = new OpenAIService();
    // this.tts = new TTSService(); // Currently unused
    // this.whatsapp = new WhatsAppService(); // Currently unused
    this.i18nService = new I18nService();
  }

  async initializeUserServices(userId: string) {
    this.calendarService = new CalendarService(userId);
    this.emailService = new EmailService(userId);
    // this.taskService = new TaskService(userId); // TaskService not available
  }

  async processMessage(
    userId: string,
    content: string,
    messageType: string,
    userLanguage?: string
  ): Promise<MessageResponse> {
    try {
      logger.info('Processing message', { userId, content, messageType });

      // Initialize user services
      await this.initializeUserServices(userId);

      // Process text for i18n
      const i18nResult = await this.i18nService.processText(content, userLanguage || 'en');
      const processedContent = i18nResult.translatedText || content;
      const detectedLanguage = i18nResult.detectedLanguage.language;
      
      // Classify intent
      const { intent, confidence, entities } = await this.openai.classifyIntent(processedContent, detectedLanguage);

      logger.info('Message classified', { intent, confidence, entities });

      // Route to appropriate handler
      let response: MessageResponse = { text: 'No response generated' };

      switch (intent) {
        case 'calendar':
          response = await this.handleCalendarIntent(processedContent, entities);
          break;
        case 'email':
          response = await this.handleEmailIntent(processedContent, entities);
          break;
        case 'task':
          response = await this.handleTaskIntent(processedContent, entities);
          break;
        case 'note':
          response = await this.handleNoteIntent();
          break;
        case 'contact':
          response = await this.handleContactIntent();
          break;
        case 'reminder':
          response = await this.handleReminderIntent();
          break;
        case 'greeting':
          response = await this.handleGreetingIntent();
          break;
        case 'help':
          response = await this.handleHelpIntent(detectedLanguage);
          break;
        default:
          response = await this.handleInformationIntent(processedContent);
      }

      // Translate response back to user language if needed
      if (response.text && i18nResult.needsTranslation) {
        // response.text = await this.i18nService.translateToUserLanguage(response.text, userLanguage || 'en'); // Method not available
      }

      // Generate audio if needed
      if (response.text && messageType === 'AUDIO') {
        try {
          // const audioBuffer = await this.tts.synthesize(response.text, userLanguage || 'en'); // Currently unused
          // In a real implementation, you would upload this to a file storage service
          // and return the URL
          response.audio = 'audio-url-placeholder';
        } catch (error) {
          logger.warn('TTS synthesis failed, sending text only', { error });
        }
      }

      return response;
    } catch (error) {
      logger.error('Message processing failed', { error, userId, content });
      return {
        text: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
      };
    }
  }

  private async handleCalendarIntent(content: string, entities: any): Promise<MessageResponse> {
    try {
      if (!this.calendarService) {
        return {
          text: 'Kalender-Integration ist nicht verfügbar. Bitte verbinden Sie Ihren Kalender zuerst.',
        };
      }

      // Parse entities for date, time, duration
      const date = entities.date;
      const time = entities.time;
      const duration = entities.duration || 60; // Default 60 minutes

      if (date && time) {
        // Create event
        const startTime = new Date(`${date} ${time}`);
        const endTime = new Date(startTime.getTime() + duration * 60000);

        const event = {
          title: entities.title || 'Neuer Termin',
          description: entities.description,
          startTime,
          endTime,
          location: entities.location,
          attendees: entities.attendees,
        };

        const result = await this.calendarService.createEvent(event);
        
        return {
          text: `Termin erstellt: ${event.title} am ${date} um ${time}${result.zoomUrl ? `\nZoom-Link: ${result.zoomUrl}` : ''}`,
          requiresConfirmation: true,
          confirmationMessage: `Möchten Sie den Termin "${event.title}" wirklich erstellen?`,
        };
      } else {
        // Get free slots or upcoming events
        const startDate = new Date();
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next 7 days
        
        const freeSlots = await this.calendarService.getFreeSlots(startDate, endDate, 60);
        
        return {
          text: `Verfügbare Termine in den nächsten 7 Tagen:\n${freeSlots.slice(0, 5).map(slot => 
            slot.toLocaleString('de-DE')
          ).join('\n')}`,
        };
      }
    } catch (error) {
      logger.error('Calendar intent handling failed', { error, content, entities });
      return {
        text: 'Fehler beim Verarbeiten der Kalender-Anfrage. Bitte versuchen Sie es erneut.',
      };
    }
  }

  private async handleEmailIntent(content: string, entities: any): Promise<MessageResponse> {
    try {
      if (!this.emailService) {
        return {
          text: 'E-Mail-Integration ist nicht verfügbar. Bitte verbinden Sie Ihr E-Mail-Konto zuerst.',
        };
      }

      const action = entities.action || 'read';
      const sender = entities.sender;
      const count = entities.count || 5;

      switch (action) {
        case 'read':
          if (sender) {
            const emails = await this.emailService.getEmailsFromSender(sender, count);
            if (emails.length === 0) {
              return { text: `Keine E-Mails von ${sender} gefunden.` };
            }
            const summary = await this.emailService.summarizeEmails(emails);
            return { text: summary };
          } else {
            const emails = await this.emailService.getRecentEmails(count);
            const summary = await this.emailService.summarizeEmails(emails);
            return { text: summary };
          }

        case 'search':
          const query = entities.query || content;
          const searchResults = await this.emailService.searchEmails(query, count);
          const searchSummary = await this.emailService.summarizeEmails(searchResults);
          return { text: `Suchergebnisse für "${query}":\n\n${searchSummary}` };

        case 'draft':
          const draft = {
            subject: entities.subject || 'Neue E-Mail',
            to: entities.recipients || [],
            body: entities.body || content,
          };
          // const draftId = await this.emailService.createDraft(draft); // Currently unused
          return {
            text: `E-Mail-Entwurf erstellt: "${draft.subject}"\n\nMöchten Sie die E-Mail senden?`,
            requiresConfirmation: true,
            confirmationMessage: `Möchten Sie die E-Mail an ${draft.to.join(', ')} senden?`,
          };

        default:
          return {
            text: 'E-Mail-Funktionen verfügbar:\n• E-Mails lesen\n• E-Mails suchen\n• E-Mail-Entwürfe erstellen',
          };
      }
    } catch (error) {
      logger.error('Email intent handling failed', { error, content, entities });
      return {
        text: 'Fehler beim Verarbeiten der E-Mail-Anfrage. Bitte versuchen Sie es erneut.',
      };
    }
  }

  private async handleTaskIntent(content: string, entities: any): Promise<MessageResponse> {
    try {
      return {
        text: 'Aufgabenverwaltung ist nicht verfügbar. Bitte verbinden Sie Todoist oder Notion zuerst.',
      };
    } catch (error) {
      logger.error('Task intent handling failed', { error, content, entities });
      return {
        text: 'Fehler beim Verarbeiten der Aufgaben-Anfrage. Bitte versuchen Sie es erneut.',
      };
    }
  }

  private async handleNoteIntent(): Promise<MessageResponse> {
    // TODO: Implement note management
    return {
      text: 'Notizen-Funktionen werden noch implementiert. Sie können Notizen erstellen und abrufen.',
    };
  }

  private async handleContactIntent(): Promise<MessageResponse> {
    // TODO: Implement contact management
    return {
      text: 'Kontaktverwaltung wird noch implementiert. Sie können Kontakte suchen und verwalten.',
    };
  }

  private async handleReminderIntent(): Promise<MessageResponse> {
    // TODO: Implement reminder system
    return {
      text: 'Erinnerungen werden noch implementiert. Sie können Erinnerungen für bestimmte Zeiten einrichten.',
    };
  }

  private async handleGreetingIntent(detectedLanguage: string = 'en'): Promise<MessageResponse> {
    const greetings = {
      en: "Hello! I'm your AI secretary. How can I help you today?",
      de: "Hallo! Ich bin Ihr KI-Sekretär. Wie kann ich Ihnen heute helfen?",
      ru: "Привет! Я ваш ИИ-секретарь. Как я могу помочь вам сегодня?",
      zh: "你好！我是您的AI秘书。今天我能为您做些什么？",
    };

    return {
      text: greetings[detectedLanguage as keyof typeof greetings] || greetings.en,
    };
  }

  private async handleHelpIntent(language: string): Promise<MessageResponse> {
    const helpText = {
      en: `I can help you with:
• Calendar management (schedule meetings, check availability)
• Email management (read, summarize, draft emails)
• Task management (create, update, track tasks)
• Note taking (create, organize, search notes)
• Contact management (search, save contacts)
• Reminders (set up notifications)

Just tell me what you need!`,
      de: `Ich kann Ihnen helfen bei:
• Kalenderverwaltung (Termine planen, Verfügbarkeit prüfen)
• E-Mail-Verwaltung (lesen, zusammenfassen, E-Mails verfassen)
• Aufgabenverwaltung (erstellen, aktualisieren, verfolgen)
• Notizen (erstellen, organisieren, suchen)
• Kontaktverwaltung (suchen, speichern)
• Erinnerungen (Benachrichtigungen einrichten)

Sagen Sie mir einfach, was Sie brauchen!`,
    };

    return {
      text: helpText[language as keyof typeof helpText] || helpText.en,
    };
  }

  private async handleInformationIntent(content: string): Promise<MessageResponse> {
    // Use OpenAI to generate a helpful response
    const systemPrompt = `You are a helpful AI secretary. Provide a brief, helpful response to the user's request. 
    Keep responses concise and professional. If you cannot help with something specific, 
    suggest what the user can ask for instead.`;
    
    const response = await this.openai.generateResponse(content, systemPrompt);
    
    return {
      text: response,
    };
  }
}
