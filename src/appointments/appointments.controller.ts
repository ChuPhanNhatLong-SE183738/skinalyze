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
import {
  InterruptAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/update-appointment-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreatedResponse, ResponseHelper } from 'src/utils/responses';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Appointment } from './entities/appointment.entity';
import { CreateSubscriptionAppointmentDto } from './dto/create-subscription-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment-dto';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a reservation (Pay-as-you-go)' })
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

  @Post('use-subscription')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create an appointment using a subscription' })
  async createWithSubscription(
    @Body() createDto: CreateSubscriptionAppointmentDto,
    @GetUser() user: User,
  ): Promise<CreatedResponse<Appointment>> {
    const appointment =
      await this.appointmentsService.createSubscriptionAppointment(
        user.userId,
        createDto,
      );

    return ResponseHelper.created(
      'Appointment created successfully using subscription.',
      appointment,
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

  @Patch('my/:id/cancel')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel my appointment (Customer only)' })
  async cancelMyAppointment(
    @GetUser() user: User,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
  ) {
    const result = await this.appointmentsService.cancelMyAppointment(
      user.userId,
      appointmentId,
    );

    return ResponseHelper.success('Appointment cancelled successfully', result);
  }

  @Patch('dermatologist/:id/report-no-show')
  @Roles(UserRole.DERMATOLOGIST)
  async reportCustomerNoShow(
    @GetUser() user: User,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
  ) {
    const result = await this.appointmentsService.reportCustomerNoShow(
      user.userId,
      appointmentId,
    );
    return ResponseHelper.success(result.message, result);
  }

  @Patch('my/:id/report-no-show')
  @Roles(UserRole.CUSTOMER)
  async reportDoctorNoShow(
    @GetUser() user: User,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
  ) {
    const result = await this.appointmentsService.reportDoctorNoShow(
      user.userId,
      appointmentId,
    );
    return ResponseHelper.success(result.message, result);
  }

  @Patch('dermatologist/:id/report-interrupt')
  @Roles(UserRole.DERMATOLOGIST)
  async interruptByDermatologist(
    @GetUser() user: User,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
    @Body() dto: InterruptAppointmentDto,
  ) {
    const result = await this.appointmentsService.interruptAppointment(
      user.userId,
      UserRole.DERMATOLOGIST,
      appointmentId,
      dto,
    );
    return ResponseHelper.success(
      'Appointment reported as INTERRUPTED',
      result,
    );
  }

  @Patch('my/:id/report-interrupt')
  @Roles(UserRole.CUSTOMER)
  async interruptByCustomer(
    @GetUser() user: User,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
    @Body() dto: InterruptAppointmentDto,
  ) {
    const result = await this.appointmentsService.interruptAppointment(
      user.userId,
      UserRole.CUSTOMER,
      appointmentId,
      dto,
    );
    return ResponseHelper.success(
      'Appointment reported as INTERRUPTED',
      result,
    );
  }
  @Patch('dermatologist/:id/cancel')
  @Roles(UserRole.DERMATOLOGIST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an appointment (Dermatologist only)' })
  async cancelByDermatologist(
    @GetUser() user: User,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
  ) {
    const result = await this.appointmentsService.cancelByDermatologist(
      user.userId,
      appointmentId,
    );
    return ResponseHelper.success(
      'Appointment cancelled by dermatologist',
      result,
    );
  }

  @Patch('dermatologist/:id/complete')
  @Roles(UserRole.DERMATOLOGIST)
  @ApiOperation({ summary: 'Mark appointment as COMPLETED (Doctor only)' })
  @ApiOkResponse({ description: 'Appointment marked as COMPLETED' })
  async completeAppointment(
    @GetUser() user: User,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
    @Body() dto: CompleteAppointmentDto,
  ) {
    const updatedAppointment =
      await this.appointmentsService.completeAppointment(
        user.userId,
        appointmentId,
        dto,
      );

    return ResponseHelper.success(
      'Appointment marked as COMPLETED',
      updatedAppointment,
    );
  }

  @Patch('my/:id/check-in')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-in to my appointment (Customer only)' })
  async checkInCustomer(
    @GetUser() user: User,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
  ) {
    await this.appointmentsService.recordCheckIn(
      appointmentId,
      user.userId,
      UserRole.CUSTOMER,
    );
    return ResponseHelper.success('Customer check-in recorded');
  }

  @Patch('dermatologist/:id/check-in')
  @Roles(UserRole.DERMATOLOGIST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-in to an appointment (Dermatologist only)' })
  async checkInDermatologist(
    @GetUser() user: User,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
  ) {
    await this.appointmentsService.recordCheckIn(
      appointmentId,
      user.userId,
      UserRole.DERMATOLOGIST,
    );
    return ResponseHelper.success('Dermatologist check-in recorded');
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
