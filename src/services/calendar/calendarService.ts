import { GoogleCalendarService, CalendarEvent } from './googleCalendar';
import { MicrosoftCalendarService } from './microsoftCalendar';
import { ZoomService, ZoomMeeting } from './zoomService';
import { getPrisma } from '../../db/prismaClient';
import { logger } from '../../utils/logger';

export class CalendarService {
  private googleCalendar?: GoogleCalendarService;
  private microsoftCalendar?: MicrosoftCalendarService;
  private zoomService?: ZoomService;

  constructor(userId: string) {
    this.initializeServices(userId);
  }

  private async initializeServices(userId: string) {
    try {
      // Get user integrations
      const prisma = getPrisma();
      const integrations = await prisma.integration.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      // Initialize Google Calendar
      const googleIntegration = integrations.find(i => i.provider === 'GOOGLE_CALENDAR');
      if (googleIntegration) {
        this.googleCalendar = new GoogleCalendarService(googleIntegration.accessToken);
      }

      // Initialize Microsoft Calendar
      const microsoftIntegration = integrations.find(i => i.provider === 'MICROSOFT_CALENDAR');
      if (microsoftIntegration) {
        this.microsoftCalendar = new MicrosoftCalendarService(microsoftIntegration.accessToken);
      }

      // Initialize Zoom
      const zoomIntegration = integrations.find(i => i.provider === 'ZOOM');
      if (zoomIntegration) {
        this.zoomService = new ZoomService(zoomIntegration.accessToken);
      }

      logger.info('Calendar services initialized', {
        userId,
        googleCalendar: !!this.googleCalendar,
        microsoftCalendar: !!this.microsoftCalendar,
        zoom: !!this.zoomService,
      });
    } catch (error) {
      logger.error('Failed to initialize calendar services', { error, userId });
    }
  }

  async createEvent(event: CalendarEvent): Promise<{ eventId: string; zoomUrl?: string }> {
    try {
      let eventId: string | undefined;
      let zoomUrl: string | undefined;

      // Create event in primary calendar (Google or Microsoft)
      if (this.googleCalendar) {
        eventId = await this.googleCalendar.createEvent(event);
      } else if (this.microsoftCalendar) {
        eventId = await this.microsoftCalendar.createEvent(event);
      }

      // Create Zoom meeting if requested
      if (this.zoomService && event.zoomUrl) {
        const zoomMeeting = await this.zoomService.createMeeting({
          topic: event.title,
          startTime: event.startTime,
          duration: Math.round((event.endTime.getTime() - event.startTime.getTime()) / 60000),
        });
        zoomUrl = zoomMeeting.joinUrl;
      }

      // Store event in database
      if (eventId) {
        const prisma = getPrisma();
        await prisma.event.create({
          data: {
            userId: '', // Will be set by caller
            title: event.title,
            description: event.description || null,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location || null,
            zoomUrl: zoomUrl || null,
          },
        });
      }

      logger.info('Calendar event created', {
        eventId,
        zoomUrl,
        title: event.title,
      });

      return { eventId: eventId!, zoomUrl: zoomUrl };
    } catch (error) {
      logger.error('Failed to create calendar event', { error, event });
      throw error;
    }
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const events: CalendarEvent[] = [];

      // Get events from Google Calendar
      if (this.googleCalendar) {
        const googleEvents = await this.googleCalendar.getEvents(startDate, endDate);
        events.push(...googleEvents);
      }

      // Get events from Microsoft Calendar
      if (this.microsoftCalendar) {
        const microsoftEvents = await this.microsoftCalendar.getEvents(startDate, endDate);
        events.push(...microsoftEvents);
      }

      // Remove duplicates and sort by start time
      const uniqueEvents = events.filter((event, index, self) =>
        index === self.findIndex(e => e.id === event.id)
      );

      uniqueEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      logger.info('Calendar events retrieved', {
        count: uniqueEvents.length,
        startDate,
        endDate,
      });

      return uniqueEvents;
    } catch (error) {
      logger.error('Failed to get calendar events', { error, startDate, endDate });
      throw error;
    }
  }

  async getFreeSlots(startDate: Date, endDate: Date, durationMinutes: number = 60): Promise<Date[]> {
    try {
      let freeSlots: Date[] = [];

      // Get free slots from primary calendar
      if (this.googleCalendar) {
        freeSlots = await this.googleCalendar.getFreeSlots(startDate, endDate, durationMinutes);
      } else if (this.microsoftCalendar) {
        freeSlots = await this.microsoftCalendar.getFreeSlots(startDate, endDate, durationMinutes);
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

  async createZoomMeeting(topic: string, startTime: Date, durationMinutes: number): Promise<ZoomMeeting> {
    try {
      if (!this.zoomService) {
        throw new Error('Zoom service not available');
      }

      const meeting = await this.zoomService.createMeeting({
        topic,
        startTime,
        duration: durationMinutes,
      });

      logger.info('Zoom meeting created', {
        meetingId: meeting.id,
        topic,
        joinUrl: meeting.joinUrl,
      });

      return meeting;
    } catch (error) {
      logger.error('Failed to create Zoom meeting', { error, topic, startTime, durationMinutes });
      throw error;
    }
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    try {
      // Update in Google Calendar
      if (this.googleCalendar) {
        await this.googleCalendar.updateEvent(eventId, updates);
      }

      // Update in Microsoft Calendar
      if (this.microsoftCalendar) {
        await this.microsoftCalendar.updateEvent(eventId, updates);
      }

      // Update in database
      const prisma = getPrisma();
      await prisma.event.updateMany({
        where: { id: eventId },
        data: {
          title: updates.title || undefined,
          description: updates.description || undefined,
          startTime: updates.startTime || undefined,
          endTime: updates.endTime || undefined,
          location: updates.location || undefined,
        },
      });

      logger.info('Calendar event updated', { eventId, updates });
    } catch (error) {
      logger.error('Failed to update calendar event', { error, eventId, updates });
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      // Delete from Google Calendar
      if (this.googleCalendar) {
        await this.googleCalendar.deleteEvent(eventId);
      }

      // Delete from Microsoft Calendar
      if (this.microsoftCalendar) {
        await this.microsoftCalendar.deleteEvent(eventId);
      }

      // Delete from database
      const prisma = getPrisma();
      await prisma.event.deleteMany({
        where: { id: eventId },
      });

      logger.info('Calendar event deleted', { eventId });
    } catch (error) {
      logger.error('Failed to delete calendar event', { error, eventId });
      throw error;
    }
  }
}





