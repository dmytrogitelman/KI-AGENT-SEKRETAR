export type CreateEventInput = {
  title: string;
  startISO: string; // 2025-10-07T13:00:00+02:00
  endISO: string;
  attendees?: string[];
  zoom?: boolean;
  location?: string;
  description?: string;
};

export type EventResult = { 
  ok: boolean; 
  id?: string; 
  joinUrl?: string; 
  provider: 'mock'|'google'|'microsoft';
  error?: string;
};

export type FreeSlot = {
  start: string;
  end: string;
  duration: number; // in minutes
};

// Mock data for demonstration
const mockEvents = new Map<string, CreateEventInput[]>();

export async function findFreeSlots(
  userId: string, 
  durationMin = 30,
  startDate?: string,
  endDate?: string
): Promise<FreeSlot[]> {
  try {
    // TODO: Integrate with real calendar APIs when OAuth tokens are available
    // For now, return mock free slots
    
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const freeSlots: FreeSlot[] = [];
    const current = new Date(start);
    
    while (current < end) {
      // Mock: assume 9 AM to 6 PM working hours, 1-hour slots
      const hour = current.getHours();
      if (hour >= 9 && hour < 18) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + durationMin * 60 * 1000);
        
        freeSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          duration: durationMin,
        });
      }
      
      current.setTime(current.getTime() + 60 * 60 * 1000); // Next hour
    }
    
    return freeSlots.slice(0, 10); // Return max 10 slots
  } catch (error) {
    console.error('[FIND FREE SLOTS ERROR]', error);
    return [];
  }
}

export async function createEvent(userId: string, input: CreateEventInput): Promise<EventResult> {
  try {
    // Validate input
    if (!input.title || !input.startISO || !input.endISO) {
      return {
        ok: false,
        provider: 'mock',
        error: 'Missing required fields: title, startISO, endISO'
      };
    }

    // Check for conflicts (mock implementation)
    const userEvents = mockEvents.get(userId) || [];
    const newStart = new Date(input.startISO);
    const newEnd = new Date(input.endISO);
    
    const hasConflict = userEvents.some(event => {
      const existingStart = new Date(event.startISO);
      const existingEnd = new Date(event.endISO);
      
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (hasConflict) {
      return {
        ok: false,
        provider: 'mock',
        error: 'Time conflict with existing event'
      };
    }

    // TODO: Replace with real Google/Microsoft Calendar + Zoom service integration
    // For demo — return mock success
    
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in mock storage
    userEvents.push(input);
    mockEvents.set(userId, userEvents);
    
    // Generate mock Zoom link if requested
    let joinUrl: string | undefined;
    if (input.zoom) {
      const meetingId = Math.random().toString().substr(2, 10);
      joinUrl = `https://zoom.us/j/${meetingId}`;
    }

    console.log(`[CALENDAR] Created event for user ${userId}:`, {
      id: eventId,
      title: input.title,
      start: input.startISO,
      end: input.endISO,
      attendees: input.attendees?.length || 0,
      zoom: !!input.zoom
    });

    return {
      ok: true,
      id: eventId,
      joinUrl,
      provider: 'mock',
    };
  } catch (error) {
    console.error('[CREATE EVENT ERROR]', error);
    return {
      ok: false,
      provider: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function updateEvent(userId: string, eventId: string, updates: Partial<CreateEventInput>): Promise<EventResult> {
  try {
    const userEvents = mockEvents.get(userId) || [];
    const eventIndex = userEvents.findIndex((_, index) => `evt_${Date.now()}_${index}` === eventId);
    
    if (eventIndex === -1) {
      return {
        ok: false,
        provider: 'mock',
        error: 'Event not found'
      };
    }

    // Update the event
    userEvents[eventIndex] = { ...userEvents[eventIndex], ...updates };
    mockEvents.set(userId, userEvents);

    return {
      ok: true,
      id: eventId,
      provider: 'mock',
    };
  } catch (error) {
    console.error('[UPDATE EVENT ERROR]', error);
    return {
      ok: false,
      provider: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deleteEvent(userId: string, eventId: string): Promise<EventResult> {
  try {
    const userEvents = mockEvents.get(userId) || [];
    const eventIndex = userEvents.findIndex((_, index) => `evt_${Date.now()}_${index}` === eventId);
    
    if (eventIndex === -1) {
      return {
        ok: false,
        provider: 'mock',
        error: 'Event not found'
      };
    }

    // Remove the event
    userEvents.splice(eventIndex, 1);
    mockEvents.set(userId, userEvents);

    return {
      ok: true,
      id: eventId,
      provider: 'mock',
    };
  } catch (error) {
    console.error('[DELETE EVENT ERROR]', error);
    return {
      ok: false,
      provider: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getEvents(userId: string, startDate?: string, endDate?: string): Promise<CreateEventInput[]> {
  try {
    const userEvents = mockEvents.get(userId) || [];
    
    if (!startDate && !endDate) {
      return userEvents;
    }

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date('2099-12-31');

    return userEvents.filter(event => {
      const eventStart = new Date(event.startISO);
      return eventStart >= start && eventStart <= end;
    });
  } catch (error) {
    console.error('[GET EVENTS ERROR]', error);
    return [];
  }
}

// Helper function to format date/time for display
export function formatEventTime(startISO: string, endISO: string, timezone = 'Europe/Berlin'): string {
  try {
    const start = new Date(startISO);
    const end = new Date(endISO);
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    };
    
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: timezone 
    });
    
    return `${startStr} - ${endStr}`;
  } catch (error) {
    return `${startISO} - ${endISO}`;
  }
}
