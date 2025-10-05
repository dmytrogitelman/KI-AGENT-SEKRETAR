import { google } from 'googleapis';
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

export class GoogleCalendarService {
  private calendar: any;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async createEvent(event: CalendarEvent): Promise<string> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.startTime.toISOString(),
            timeZone: 'Europe/Berlin',
          },
          end: {
            dateTime: event.endTime.toISOString(),
            timeZone: 'Europe/Berlin',
          },
          location: event.location,
          attendees: event.attendees?.map(email => ({ email })),
        },
      });

      logger.info('Google Calendar event created', {
        eventId: response.data.id,
        title: event.title,
      });

      return response.data.id;
    } catch (error) {
      logger.error('Failed to create Google Calendar event', { error, event });
      throw error;
    }
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events: CalendarEvent[] = response.data.items?.map((item: any) => ({
        id: item.id,
        title: item.summary || 'Untitled Event',
        description: item.description,
        startTime: new Date(item.start.dateTime || item.start.date),
        endTime: new Date(item.end.dateTime || item.end.date),
        location: item.location,
        attendees: item.attendees?.map((attendee: any) => attendee.email),
      })) || [];

      logger.info('Google Calendar events retrieved', {
        count: events.length,
        startDate,
        endDate,
      });

      return events;
    } catch (error) {
      logger.error('Failed to get Google Calendar events', { error, startDate, endDate });
      throw error;
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    try {
      await this.calendar.events.update({
        calendarId: 'primary',
        eventId,
        resource: {
          summary: event.title,
          description: event.description,
          start: event.startTime ? {
            dateTime: event.startTime.toISOString(),
            timeZone: 'Europe/Berlin',
          } : undefined,
          end: event.endTime ? {
            dateTime: event.endTime.toISOString(),
            timeZone: 'Europe/Berlin',
          } : undefined,
          location: event.location,
          attendees: event.attendees?.map(email => ({ email })),
        },
      });

      logger.info('Google Calendar event updated', { eventId });
    } catch (error) {
      logger.error('Failed to update Google Calendar event', { error, eventId, event });
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      logger.info('Google Calendar event deleted', { eventId });
    } catch (error) {
      logger.error('Failed to delete Google Calendar event', { error, eventId });
      throw error;
    }
  }

  async getFreeSlots(startDate: Date, endDate: Date, durationMinutes: number = 60): Promise<Date[]> {
    try {
      const events = await this.getEvents(startDate, endDate);
      const freeSlots: Date[] = [];
      
      // Simple algorithm to find free slots
      // In production, you'd want a more sophisticated approach
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





