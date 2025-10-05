import { OpenAIService } from '../services/llm/openaiClient';
import { TTSService } from '../services/tts/ttsService';
import { WhatsAppService } from '../services/whatsapp/twilioClient';
import { CalendarService } from '../services/calendar/calendarService';
import { EmailService } from '../services/email/emailService';
import { TaskService } from '../services/tasks/taskService';
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
  private tts: TTSService;
  private whatsapp: WhatsAppService;
  private calendarService?: CalendarService;
  private emailService?: EmailService;
  private taskService?: TaskService;
  private i18nService: I18nService;

  constructor() {
    this.openai = new OpenAIService();
    this.tts = new TTSService();
    this.whatsapp = new WhatsAppService();
    this.i18nService = new I18nService();
  }

  async initializeUserServices(userId: string) {
    this.calendarService = new CalendarService(userId);
    this.emailService = new EmailService(userId);
    this.taskService = new TaskService(userId);
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
      let response: MessageResponse;

      switch (intent) {
        case 'calendar':
          response = await this.handleCalendarIntent(processedContent, entities, detectedLanguage);
          break;
        case 'email':
          response = await this.handleEmailIntent(processedContent, entities, detectedLanguage);
          break;
        case 'task':
          response = await this.handleTaskIntent(processedContent, entities, detectedLanguage);
          break;
        case 'note':
          response = await this.handleNoteIntent(processedContent, entities, detectedLanguage);
          break;
        case 'contact':
          response = await this.handleContactIntent(processedContent, entities, detectedLanguage);
          break;
        case 'reminder':
          response = await this.handleReminderIntent(processedContent, entities, detectedLanguage);
          break;
        case 'greeting':
          response = await this.handleGreetingIntent(processedContent, detectedLanguage);
          break;
        case 'help':
          response = await this.handleHelpIntent(detectedLanguage);
          break;
        default:
          response = await this.handleInformationIntent(processedContent, detectedLanguage);
      }

      // Translate response back to user language if needed
      if (response.text && i18nResult.needsTranslation) {
        response.text = await this.i18nService.translateToUserLanguage(response.text, userLanguage || 'en');
      }

      // Generate audio if needed
      if (response.text && messageType === 'AUDIO') {
        try {
          const audioBuffer = await this.tts.synthesize(response.text, userLanguage || 'en');
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

  private async handleCalendarIntent(content: string, entities: any, language: string): Promise<MessageResponse> {
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

  private async handleEmailIntent(content: string, entities: any, language: string): Promise<MessageResponse> {
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
          const draftId = await this.emailService.createDraft(draft);
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

  private async handleTaskIntent(content: string, entities: any, language: string): Promise<MessageResponse> {
    try {
      if (!this.taskService) {
        return {
          text: 'Aufgabenverwaltung ist nicht verfügbar. Bitte verbinden Sie Todoist oder Notion zuerst.',
        };
      }

      const action = entities.action || 'create';
      const title = entities.title || content;
      const description = entities.description;
      const dueDate = entities.dueDate;
      const priority = entities.priority || 'medium';

      switch (action) {
        case 'create':
          const task = await this.taskService.createTask({
            title,
            description,
            status: 'pending',
            priority: priority as any,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            tags: entities.tags,
          });
          return {
            text: `Aufgabe erstellt: "${task.title}"${task.dueDate ? ` (Fällig: ${task.dueDate.toLocaleDateString('de-DE')})` : ''}`,
          };

        case 'list':
          const tasks = await this.taskService.getTasks();
          const pendingTasks = tasks.filter(t => t.status !== 'completed').slice(0, 10);
          if (pendingTasks.length === 0) {
            return { text: 'Keine ausstehenden Aufgaben gefunden.' };
          }
          const taskList = pendingTasks.map((t, i) => 
            `${i + 1}. ${t.title} (${t.priority})${t.dueDate ? ` - Fällig: ${t.dueDate.toLocaleDateString('de-DE')}` : ''}`
          ).join('\n');
          return { text: `Ihre Aufgaben:\n${taskList}` };

        case 'complete':
          const taskId = entities.taskId;
          if (taskId) {
            await this.taskService.completeTask(taskId);
            return { text: `Aufgabe "${taskId}" als erledigt markiert.` };
          }
          return { text: 'Bitte geben Sie die Aufgaben-ID an, die Sie als erledigt markieren möchten.' };

        default:
          return {
            text: 'Aufgabenverwaltung verfügbar:\n• Aufgaben erstellen\n• Aufgaben auflisten\n• Aufgaben als erledigt markieren',
          };
      }
    } catch (error) {
      logger.error('Task intent handling failed', { error, content, entities });
      return {
        text: 'Fehler beim Verarbeiten der Aufgaben-Anfrage. Bitte versuchen Sie es erneut.',
      };
    }
  }

  private async handleNoteIntent(content: string, entities: any, language: string): Promise<MessageResponse> {
    // TODO: Implement note management
    return {
      text: 'Notizen-Funktionen werden noch implementiert. Sie können Notizen erstellen und abrufen.',
    };
  }

  private async handleContactIntent(content: string, entities: any, language: string): Promise<MessageResponse> {
    // TODO: Implement contact management
    return {
      text: 'Kontaktverwaltung wird noch implementiert. Sie können Kontakte suchen und verwalten.',
    };
  }

  private async handleReminderIntent(content: string, entities: any, language: string): Promise<MessageResponse> {
    // TODO: Implement reminder system
    return {
      text: 'Erinnerungen werden noch implementiert. Sie können Erinnerungen für bestimmte Zeiten einrichten.',
    };
  }

  private async handleGreetingIntent(content: string, language: string): Promise<MessageResponse> {
    const greetings = {
      en: "Hello! I'm your AI secretary. How can I help you today?",
      de: "Hallo! Ich bin Ihr KI-Sekretär. Wie kann ich Ihnen heute helfen?",
      ru: "Привет! Я ваш ИИ-секретарь. Как я могу помочь вам сегодня?",
      zh: "你好！我是您的AI秘书。今天我能为您做些什么？",
    };

    return {
      text: greetings[language as keyof typeof greetings] || greetings.en,
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

  private async handleInformationIntent(content: string, language: string): Promise<MessageResponse> {
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
