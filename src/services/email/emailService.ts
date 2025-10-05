import { GmailService, EmailMessage, EmailDraft } from './gmailService';
import { MicrosoftMailService } from './microsoftMailService';
import { prisma } from '../../db/prismaClient';
import { logger } from '../../utils/logger';

export class EmailService {
  private gmailService?: GmailService;
  private microsoftMailService?: MicrosoftMailService;

  constructor(userId: string) {
    this.initializeServices(userId);
  }

  private async initializeServices(userId: string) {
    try {
      // Get user integrations
      const integrations = await prisma.integration.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      // Initialize Gmail
      const gmailIntegration = integrations.find(i => i.provider === 'GMAIL');
      if (gmailIntegration) {
        this.gmailService = new GmailService(gmailIntegration.accessToken);
      }

      // Initialize Microsoft Mail
      const microsoftIntegration = integrations.find(i => i.provider === 'MICROSOFT_MAIL');
      if (microsoftIntegration) {
        this.microsoftMailService = new MicrosoftMailService(microsoftIntegration.accessToken);
      }

      logger.info('Email services initialized', {
        userId,
        gmail: !!this.gmailService,
        microsoftMail: !!this.microsoftMailService,
      });
    } catch (error) {
      logger.error('Failed to initialize email services', { error, userId });
    }
  }

  async getRecentEmails(maxResults: number = 10): Promise<EmailMessage[]> {
    try {
      const emails: EmailMessage[] = [];

      // Get emails from Gmail
      if (this.gmailService) {
        const gmailEmails = await this.gmailService.getMessages(maxResults);
        emails.push(...gmailEmails);
      }

      // Get emails from Microsoft Mail
      if (this.microsoftMailService) {
        const microsoftEmails = await this.microsoftMailService.getMessages(maxResults);
        emails.push(...microsoftEmails);
      }

      // Remove duplicates and sort by date
      const uniqueEmails = emails.filter((email, index, self) =>
        index === self.findIndex(e => e.id === email.id)
      );

      uniqueEmails.sort((a, b) => b.date.getTime() - a.date.getTime());

      logger.info('Recent emails retrieved', {
        count: uniqueEmails.length,
        maxResults,
      });

      return uniqueEmails;
    } catch (error) {
      logger.error('Failed to get recent emails', { error, maxResults });
      throw error;
    }
  }

  async searchEmails(query: string, maxResults: number = 10): Promise<EmailMessage[]> {
    try {
      const emails: EmailMessage[] = [];

      // Search in Gmail
      if (this.gmailService) {
        const gmailEmails = await this.gmailService.searchMessages(query, maxResults);
        emails.push(...gmailEmails);
      }

      // Search in Microsoft Mail
      if (this.microsoftMailService) {
        const microsoftEmails = await this.microsoftMailService.searchMessages(query, maxResults);
        emails.push(...microsoftEmails);
      }

      // Remove duplicates and sort by date
      const uniqueEmails = emails.filter((email, index, self) =>
        index === self.findIndex(e => e.id === email.id)
      );

      uniqueEmails.sort((a, b) => b.date.getTime() - a.date.getTime());

      logger.info('Emails searched', {
        count: uniqueEmails.length,
        query,
      });

      return uniqueEmails;
    } catch (error) {
      logger.error('Failed to search emails', { error, query });
      throw error;
    }
  }

  async getEmailsFromSender(sender: string, maxResults: number = 10): Promise<EmailMessage[]> {
    try {
      const emails: EmailMessage[] = [];

      // Search in Gmail
      if (this.gmailService) {
        const gmailEmails = await this.gmailService.searchMessages(`from:${sender}`, maxResults);
        emails.push(...gmailEmails);
      }

      // Search in Microsoft Mail
      if (this.microsoftMailService) {
        const microsoftEmails = await this.microsoftMailService.searchMessages(sender, maxResults);
        emails.push(...microsoftEmails);
      }

      // Remove duplicates and sort by date
      const uniqueEmails = emails.filter((email, index, self) =>
        index === self.findIndex(e => e.id === email.id)
      );

      uniqueEmails.sort((a, b) => b.date.getTime() - a.date.getTime());

      logger.info('Emails from sender retrieved', {
        count: uniqueEmails.length,
        sender,
      });

      return uniqueEmails;
    } catch (error) {
      logger.error('Failed to get emails from sender', { error, sender });
      throw error;
    }
  }

  async createDraft(draft: EmailDraft): Promise<string> {
    try {
      let draftId: string | undefined;

      // Create draft in primary email service
      if (this.gmailService) {
        draftId = await this.gmailService.createDraft(draft);
      } else if (this.microsoftMailService) {
        draftId = await this.microsoftMailService.createDraft(draft);
      }

      if (!draftId) {
        throw new Error('No email service available');
      }

      logger.info('Email draft created', {
        draftId,
        subject: draft.subject,
      });

      return draftId;
    } catch (error) {
      logger.error('Failed to create email draft', { error, draft });
      throw error;
    }
  }

  async sendDraft(draftId: string): Promise<void> {
    try {
      // Send draft from primary email service
      if (this.gmailService) {
        await this.gmailService.sendDraft(draftId);
      } else if (this.microsoftMailService) {
        await this.microsoftMailService.sendDraft(draftId);
      } else {
        throw new Error('No email service available');
      }

      logger.info('Email draft sent', { draftId });
    } catch (error) {
      logger.error('Failed to send email draft', { error, draftId });
      throw error;
    }
  }

  async sendMessage(message: EmailDraft): Promise<string> {
    try {
      let messageId: string | undefined;

      // Send message from primary email service
      if (this.gmailService) {
        messageId = await this.gmailService.sendMessage(message);
      } else if (this.microsoftMailService) {
        messageId = await this.microsoftMailService.sendMessage(message);
      } else {
        throw new Error('No email service available');
      }

      logger.info('Email message sent', {
        messageId,
        subject: message.subject,
      });

      return messageId;
    } catch (error) {
      logger.error('Failed to send email message', { error, message });
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      // Mark as read in both services if available
      if (this.gmailService) {
        await this.gmailService.markAsRead(messageId);
      }
      if (this.microsoftMailService) {
        await this.microsoftMailService.markAsRead(messageId);
      }

      logger.info('Email message marked as read', { messageId });
    } catch (error) {
      logger.error('Failed to mark email message as read', { error, messageId });
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      // Delete from both services if available
      if (this.gmailService) {
        await this.gmailService.deleteMessage(messageId);
      }
      if (this.microsoftMailService) {
        await this.microsoftMailService.deleteMessage(messageId);
      }

      logger.info('Email message deleted', { messageId });
    } catch (error) {
      logger.error('Failed to delete email message', { error, messageId });
      throw error;
    }
  }

  async summarizeEmails(emails: EmailMessage[]): Promise<string> {
    try {
      if (emails.length === 0) {
        return 'Keine E-Mails zum Zusammenfassen gefunden.';
      }

      const summary = emails.map((email, index) => {
        return `${index + 1}. **${email.subject}** (von: ${email.from}, ${email.date.toLocaleDateString('de-DE')})\n   ${email.body.substring(0, 200)}...`;
      }).join('\n\n');

      return `Zusammenfassung der ${emails.length} E-Mails:\n\n${summary}`;
    } catch (error) {
      logger.error('Failed to summarize emails', { error, emailCount: emails.length });
      return 'Fehler beim Zusammenfassen der E-Mails.';
    }
  }
}





