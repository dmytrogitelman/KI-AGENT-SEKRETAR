import { google } from 'googleapis';
import { logger } from '../../utils/logger';

export interface EmailMessage {
  id?: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  htmlBody?: string;
  date: Date;
  isRead: boolean;
  labels?: string[];
}

export interface EmailDraft {
  id?: string;
  subject: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  htmlBody?: string;
}

export class GmailService {
  private gmail: any;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async getMessages(maxResults: number = 10, query?: string): Promise<EmailMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
      });

      const messages: EmailMessage[] = [];

      for (const message of response.data.messages || []) {
        const messageDetail = await this.getMessage(message.id);
        if (messageDetail) {
          messages.push(messageDetail);
        }
      }

      logger.info('Gmail messages retrieved', {
        count: messages.length,
        query,
      });

      return messages;
    } catch (error) {
      logger.error('Failed to get Gmail messages', { error, query });
      throw error;
    }
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const headers = response.data.payload.headers;
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

      const subject = getHeader('Subject') || '';
      const from = getHeader('From') || '';
      const to = getHeader('To')?.split(',').map((email: string) => email.trim()) || [];
      const cc = getHeader('Cc')?.split(',').map((email: string) => email.trim()) || [];
      const date = new Date(getHeader('Date') || '');

      // Extract body
      let body = '';
      let htmlBody = '';
      
      if (response.data.payload.body?.data) {
        body = Buffer.from(response.data.payload.body.data, 'base64').toString();
      } else if (response.data.payload.parts) {
        for (const part of response.data.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
          } else if (part.mimeType === 'text/html' && part.body?.data) {
            htmlBody = Buffer.from(part.body.data, 'base64').toString();
          }
        }
      }

      const message: EmailMessage = {
        id: messageId,
        subject,
        from,
        to,
        cc,
        body,
        htmlBody,
        date,
        isRead: !response.data.labelIds?.includes('UNREAD'),
        labels: response.data.labelIds || [],
      };

      return message;
    } catch (error) {
      logger.error('Failed to get Gmail message', { error, messageId });
      return null;
    }
  }

  async createDraft(draft: EmailDraft): Promise<string> {
    try {
      const message = this.createMessage(draft);
      
      const response = await this.gmail.users.drafts.create({
        userId: 'me',
        resource: {
          message: {
            raw: Buffer.from(message).toString('base64'),
          },
        },
      });

      logger.info('Gmail draft created', {
        draftId: response.data.id,
        subject: draft.subject,
      });

      return response.data.id;
    } catch (error) {
      logger.error('Failed to create Gmail draft', { error, draft });
      throw error;
    }
  }

  async sendDraft(draftId: string): Promise<void> {
    try {
      await this.gmail.users.drafts.send({
        userId: 'me',
        resource: {
          id: draftId,
        },
      });

      logger.info('Gmail draft sent', { draftId });
    } catch (error) {
      logger.error('Failed to send Gmail draft', { error, draftId });
      throw error;
    }
  }

  async sendMessage(message: EmailDraft): Promise<string> {
    try {
      const rawMessage = this.createMessage(message);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: Buffer.from(rawMessage).toString('base64'),
        },
      });

      logger.info('Gmail message sent', {
        messageId: response.data.id,
        subject: message.subject,
      });

      return response.data.id;
    } catch (error) {
      logger.error('Failed to send Gmail message', { error, message });
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: {
          removeLabelIds: ['UNREAD'],
        },
      });

      logger.info('Gmail message marked as read', { messageId });
    } catch (error) {
      logger.error('Failed to mark Gmail message as read', { error, messageId });
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.delete({
        userId: 'me',
        id: messageId,
      });

      logger.info('Gmail message deleted', { messageId });
    } catch (error) {
      logger.error('Failed to delete Gmail message', { error, messageId });
      throw error;
    }
  }

  async searchMessages(query: string, maxResults: number = 10): Promise<EmailMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
      });

      const messages: EmailMessage[] = [];

      for (const message of response.data.messages || []) {
        const messageDetail = await this.getMessage(message.id);
        if (messageDetail) {
          messages.push(messageDetail);
        }
      }

      logger.info('Gmail messages searched', {
        count: messages.length,
        query,
      });

      return messages;
    } catch (error) {
      logger.error('Failed to search Gmail messages', { error, query });
      throw error;
    }
  }

  private createMessage(message: EmailDraft): string {
    const to = message.to.join(', ');
    const cc = message.cc?.join(', ') || '';
    const bcc = message.bcc?.join(', ') || '';

    let email = `To: ${to}\r\n`;
    if (cc) email += `Cc: ${cc}\r\n`;
    if (bcc) email += `Bcc: ${bcc}\r\n`;
    email += `Subject: ${message.subject}\r\n`;
    email += `Content-Type: text/html; charset=utf-8\r\n`;
    email += `\r\n`;
    email += message.htmlBody || message.body;

    return email;
  }
}





