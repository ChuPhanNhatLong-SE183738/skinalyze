import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AppointmentsService,
  AppointmentReservationResult,
} from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreatedResponse, ResponseHelper } from 'src/utils/responses';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @GetUser() user: User,
  ): Promise<CreatedResponse<AppointmentReservationResult>> {
    const paymentDetails: AppointmentReservationResult =
      await this.appointmentsService.createReservation(
        user.userId,
        createAppointmentDto,
      );

    return ResponseHelper.created(
      'Appointment reservation created. Please complete payment.',
      paymentDetails,
    );
  }

  @Get()
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateAppointmentStatusDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(
      id,
      updateAppointmentStatusDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Patch(':appointmentId/generate-meet-link')
  @Roles(UserRole.DERMATOLOGIST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually generate a Google Meet link' })
  async generateManualMeetLink(
    @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
    @GetUser() user: User,
  ) {
    const meetLink = await this.appointmentsService.generateManualMeetLink(
      user.userId,
      appointmentId,
    );

    return ResponseHelper.success('Meet link generated successfully', {
      meetLink,
    });
  }
}
