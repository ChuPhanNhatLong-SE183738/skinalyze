import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { google } from 'googleapis';
import * as path from 'path';
import { CreateMeetDto } from './dto/create-meet.dto';

@Injectable()
export class GoogleMeetService {
  private readonly logger = new Logger(GoogleMeetService.name);
  private readonly KEYFILEPATH = path.join(
    process.cwd(),
    'skinalyze-475715-0f499dd5cd61.json',
  );
  private readonly SCOPES = ['https://www.googleapis.com/auth/calendar'];
  private readonly USER_TO_IMPERSONATE = 'lonh@nhatlonh.id.vn';

  /**
   * Tạo Google Meet link cho cuộc hẹn
   */
  async createMeetLink(createMeetDto: CreateMeetDto): Promise<string> {
    const { summary, startTimeISO, endTimeISO } = createMeetDto;

    // Validate datetime
    const startDate = new Date(startTimeISO);
    const endDate = new Date(endTimeISO);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid datetime format');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('End time must be after start time');
    }

    try {
      // 1. Authenticate with impersonation
      const auth = new google.auth.GoogleAuth({
        keyFile: this.KEYFILEPATH,
        scopes: this.SCOPES,
        clientOptions: {
          subject: this.USER_TO_IMPERSONATE,
        },
      });

      const calendar = google.calendar({ version: 'v3', auth });

      // 2. Create calendar event with Meet link
      const event = {
        summary,
        start: {
          dateTime: startTimeISO,
          timeZone: 'Asia/Ho_Chi_Minh',
        },
        end: {
          dateTime: endTimeISO,
          timeZone: 'Asia/Ho_Chi_Minh',
        },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
      });

      const meetLink = response.data.hangoutLink;

      if (!meetLink) {
        throw new Error('Failed to generate Google Meet link');
      }

      this.logger.log(`✅ Created Google Meet link: ${meetLink}`);
      return meetLink;
    } catch (error) {
      this.logger.error(`❌ Error creating Google Meet link: ${error.message}`);
      if (error.response) {
        this.logger.error(
          `Error details: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw new BadRequestException(
        `Failed to create Google Meet link: ${error.message}`,
      );
    }
  }

  /**
   * Helper method để tạo Meet link từ Date objects
   */
  async createMeetLinkFromDates(
    summary: string,
    startTime: Date,
    endTime: Date,
  ): Promise<string> {
    return this.createMeetLink({
      summary,
      startTimeISO: startTime.toISOString(),
      endTimeISO: endTime.toISOString(),
    });
  }
}
