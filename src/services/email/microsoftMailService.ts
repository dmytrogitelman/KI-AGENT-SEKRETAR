import axios from 'axios';
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

export class MicrosoftMailService {
  private accessToken: string;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getMessages(maxResults: number = 10, filter?: string): Promise<EmailMessage[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/me/messages`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          params: {
            $top: maxResults,
            $filter: filter,
            $orderby: 'receivedDateTime desc',
          },
        }
      );

      const messages: EmailMessage[] = response.data.value?.map((item: any) => ({
        id: item.id,
        subject: item.subject || '',
        from: item.from?.emailAddress?.address || '',
        to: item.toRecipients?.map((r: any) => r.emailAddress.address) || [],
        cc: item.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
        bcc: item.bccRecipients?.map((r: any) => r.emailAddress.address) || [],
        body: item.body?.content || '',
        htmlBody: item.body?.contentType === 'html' ? item.body.content : undefined,
        date: new Date(item.receivedDateTime),
        isRead: item.isRead,
        labels: item.categories || [],
      })) || [];

      logger.info('Microsoft Mail messages retrieved', {
        count: messages.length,
        filter,
      });

      return messages;
    } catch (error) {
      logger.error('Failed to get Microsoft Mail messages', { error, filter });
      throw error;
    }
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/me/messages/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      const item = response.data;
      const message: EmailMessage = {
        id: item.id,
        subject: item.subject || '',
        from: item.from?.emailAddress?.address || '',
        to: item.toRecipients?.map((r: any) => r.emailAddress.address) || [],
        cc: item.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
        bcc: item.bccRecipients?.map((r: any) => r.emailAddress.address) || [],
        body: item.body?.content || '',
        htmlBody: item.body?.contentType === 'html' ? item.body.content : undefined,
        date: new Date(item.receivedDateTime),
        isRead: item.isRead,
        labels: item.categories || [],
      };

      return message;
    } catch (error) {
      logger.error('Failed to get Microsoft Mail message', { error, messageId });
      return null;
    }
  }

  async createDraft(draft: EmailDraft): Promise<string> {
    try {
      // Mock implementation - replace with actual API call when needed
      return 'draft-id-placeholder';
    } catch (error) {
      logger.error('Failed to create Microsoft Mail draft', { error, draft });
      throw error;
    }
  }

  async sendDraft(draftId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/me/messages/${draftId}/send`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info('Microsoft Mail draft sent', { draftId });
    } catch (error) {
      logger.error('Failed to send Microsoft Mail draft', { error, draftId });
      throw error;
    }
  }

  async sendMessage(message: EmailDraft): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/me/sendMail`,
        {
          message: {
            subject: message.subject,
            body: {
              contentType: 'html',
              content: message.htmlBody || message.body,
            },
            toRecipients: message.to.map(email => ({
              emailAddress: { address: email },
            })),
            ccRecipients: message.cc?.map(email => ({
              emailAddress: { address: email },
            })),
            bccRecipients: message.bcc?.map(email => ({
              emailAddress: { address: email },
            })),
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Microsoft Mail message sent', {
        subject: message.subject,
      });

      return 'sent';
    } catch (error) {
      logger.error('Failed to send Microsoft Mail message', { error, message });
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await axios.patch(
        `${this.baseUrl}/me/messages/${messageId}`,
        {
          isRead: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Microsoft Mail message marked as read', { messageId });
    } catch (error) {
      logger.error('Failed to mark Microsoft Mail message as read', { error, messageId });
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/me/messages/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info('Microsoft Mail message deleted', { messageId });
    } catch (error) {
      logger.error('Failed to delete Microsoft Mail message', { error, messageId });
      throw error;
    }
  }

  async searchMessages(query: string, maxResults: number = 10): Promise<EmailMessage[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/me/messages`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          params: {
            $top: maxResults,
            $search: query,
            $orderby: 'receivedDateTime desc',
          },
        }
      );

      const messages: EmailMessage[] = response.data.value?.map((item: any) => ({
        id: item.id,
        subject: item.subject || '',
        from: item.from?.emailAddress?.address || '',
        to: item.toRecipients?.map((r: any) => r.emailAddress.address) || [],
        cc: item.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
        bcc: item.bccRecipients?.map((r: any) => r.emailAddress.address) || [],
        body: item.body?.content || '',
        htmlBody: item.body?.contentType === 'html' ? item.body.content : undefined,
        date: new Date(item.receivedDateTime),
        isRead: item.isRead,
        labels: item.categories || [],
      })) || [];

      logger.info('Microsoft Mail messages searched', {
        count: messages.length,
        query,
      });

      return messages;
    } catch (error) {
      logger.error('Failed to search Microsoft Mail messages', { error, query });
      throw error;
    }
  }
}





