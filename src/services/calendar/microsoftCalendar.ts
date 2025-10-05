import axios from 'axios';
import { logger } from '../../utils/logger';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  zoomUrl?: string;
}

export class MicrosoftCalendarService {
  private accessToken: string;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async createEvent(event: CalendarEvent): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/me/events`,
        {
          subject: event.title,
          body: {
            contentType: 'text',
            content: event.description || '',
          },
          start: {
            dateTime: event.startTime.toISOString(),
            timeZone: 'Europe/Berlin',
          },
          end: {
            dateTime: event.endTime.toISOString(),
            timeZone: 'Europe/Berlin',
          },
          location: event.location ? {
            displayName: event.location,
          } : undefined,
          attendees: event.attendees?.map(email => ({
            emailAddress: { address: email },
            type: 'required',
          })),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Microsoft Calendar event created', {
        eventId: response.data.id,
        title: event.title,
      });

      return response.data.id;
    } catch (error) {
      logger.error('Failed to create Microsoft Calendar event', { error, event });
      throw error;
    }
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/me/events`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          params: {
            $filter: `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`,
            $orderby: 'start/dateTime',
          },
        }
      );

      const events: CalendarEvent[] = response.data.value?.map((item: any) => ({
        id: item.id,
        title: item.subject || 'Untitled Event',
        description: item.body?.content,
        startTime: new Date(item.start.dateTime),
        endTime: new Date(item.end.dateTime),
        location: item.location?.displayName,
        attendees: item.attendees?.map((attendee: any) => attendee.emailAddress.address),
      })) || [];

      logger.info('Microsoft Calendar events retrieved', {
        count: events.length,
        startDate,
        endDate,
      });

      return events;
    } catch (error) {
      logger.error('Failed to get Microsoft Calendar events', { error, startDate, endDate });
      throw error;
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    try {
      await axios.patch(
        `${this.baseUrl}/me/events/${eventId}`,
        {
          subject: event.title,
          body: event.description ? {
            contentType: 'text',
            content: event.description,
          } : undefined,
          start: event.startTime ? {
            dateTime: event.startTime.toISOString(),
            timeZone: 'Europe/Berlin',
          } : undefined,
          end: event.endTime ? {
            dateTime: event.endTime.toISOString(),
            timeZone: 'Europe/Berlin',
          } : undefined,
          location: event.location ? {
            displayName: event.location,
          } : undefined,
          attendees: event.attendees?.map(email => ({
            emailAddress: { address: email },
            type: 'required',
          })),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Microsoft Calendar event updated', { eventId });
    } catch (error) {
      logger.error('Failed to update Microsoft Calendar event', { error, eventId, event });
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/me/events/${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info('Microsoft Calendar event deleted', { eventId });
    } catch (error) {
      logger.error('Failed to delete Microsoft Calendar event', { error, eventId });
      throw error;
    }
  }

  async getFreeSlots(startDate: Date, endDate: Date, durationMinutes: number = 60): Promise<Date[]> {
    try {
      const events = await this.getEvents(startDate, endDate);
      const freeSlots: Date[] = [];
      
      const current = new Date(startDate);
      const end = new Date(endDate);
      
      while (current < end) {
        const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
        
        const hasConflict = events.some(event => {
          return (current >= event.startTime && current < event.endTime) ||
                 (slotEnd > event.startTime && slotEnd <= event.endTime) ||
                 (current <= event.startTime && slotEnd >= event.endTime);
        });
        
        if (!hasConflict) {
          freeSlots.push(new Date(current));
        }
        
        current.setHours(current.getHours() + 1);
      }

      logger.info('Free slots calculated', {
        count: freeSlots.length,
        startDate,
        endDate,
        durationMinutes,
      });

      return freeSlots;
    } catch (error) {
      logger.error('Failed to get free slots', { error, startDate, endDate, durationMinutes });
      throw error;
    }
  }
}





