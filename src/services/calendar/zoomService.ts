import axios from 'axios';
import { logger } from '../../utils/logger';

export interface ZoomMeeting {
  id?: string;
  topic: string;
  startTime: Date;
  duration: number; // in minutes
  joinUrl: string;
  password?: string;
  hostId?: string;
}

export class ZoomService {
  private accessToken: string;
  private baseUrl = 'https://api.zoom.us/v2';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async createMeeting(meeting: Omit<ZoomMeeting, 'id' | 'joinUrl'>): Promise<ZoomMeeting> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/users/me/meetings`,
        {
          topic: meeting.topic,
          type: 2, // Scheduled meeting
          start_time: meeting.startTime.toISOString(),
          duration: meeting.duration,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: true,
            auto_recording: 'local',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const zoomMeeting: ZoomMeeting = {
        id: response.data.id,
        topic: response.data.topic,
        startTime: new Date(response.data.start_time),
        duration: response.data.duration,
        joinUrl: response.data.join_url,
        password: response.data.password,
        hostId: response.data.host_id,
      };

      logger.info('Zoom meeting created', {
        meetingId: zoomMeeting.id,
        topic: meeting.topic,
        joinUrl: zoomMeeting.joinUrl,
      });

      return zoomMeeting;
    } catch (error) {
      logger.error('Failed to create Zoom meeting', { error, meeting });
      throw error;
    }
  }

  async getMeeting(meetingId: string): Promise<ZoomMeeting> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      const meeting: ZoomMeeting = {
        id: response.data.id,
        topic: response.data.topic,
        startTime: new Date(response.data.start_time),
        duration: response.data.duration,
        joinUrl: response.data.join_url,
        password: response.data.password,
        hostId: response.data.host_id,
      };

      logger.info('Zoom meeting retrieved', { meetingId });

      return meeting;
    } catch (error) {
      logger.error('Failed to get Zoom meeting', { error, meetingId });
      throw error;
    }
  }

  async updateMeeting(meetingId: string, updates: Partial<ZoomMeeting>): Promise<void> {
    try {
      await axios.patch(
        `${this.baseUrl}/meetings/${meetingId}`,
        {
          topic: updates.topic,
          start_time: updates.startTime?.toISOString(),
          duration: updates.duration,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Zoom meeting updated', { meetingId });
    } catch (error) {
      logger.error('Failed to update Zoom meeting', { error, meetingId, updates });
      throw error;
    }
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info('Zoom meeting deleted', { meetingId });
    } catch (error) {
      logger.error('Failed to delete Zoom meeting', { error, meetingId });
      throw error;
    }
  }

  async getUpcomingMeetings(): Promise<ZoomMeeting[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/users/me/meetings`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          params: {
            type: 'upcoming',
          },
        }
      );

      const meetings: ZoomMeeting[] = response.data.meetings?.map((meeting: any) => ({
        id: meeting.id,
        topic: meeting.topic,
        startTime: new Date(meeting.start_time),
        duration: meeting.duration,
        joinUrl: meeting.join_url,
        password: meeting.password,
        hostId: meeting.host_id,
      })) || [];

      logger.info('Upcoming Zoom meetings retrieved', {
        count: meetings.length,
      });

      return meetings;
    } catch (error) {
      logger.error('Failed to get upcoming Zoom meetings', { error });
      throw error;
    }
  }

  async generateInstantMeeting(topic: string, duration: number = 60): Promise<ZoomMeeting> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/users/me/meetings`,
        {
          topic,
          type: 1, // Instant meeting
          duration,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            mute_upon_entry: false,
            waiting_room: false,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const meeting: ZoomMeeting = {
        id: response.data.id,
        topic: response.data.topic,
        startTime: new Date(),
        duration: response.data.duration,
        joinUrl: response.data.join_url,
        password: response.data.password,
        hostId: response.data.host_id,
      };

      logger.info('Instant Zoom meeting created', {
        meetingId: meeting.id,
        topic,
        joinUrl: meeting.joinUrl,
      });

      return meeting;
    } catch (error) {
      logger.error('Failed to create instant Zoom meeting', { error, topic, duration });
      throw error;
    }
  }
}





