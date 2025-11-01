import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { AvailabilitySlotsService } from './availability-slots.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { DermatologistsService } from '../dermatologists/dermatologists.service';
import { ResponseHelper } from '../utils/responses';

@Controller('availability-slots')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DERMATOLOGIST)
export class AvailabilitySlotsController {
  constructor(
    private readonly availabilitySlotsService: AvailabilitySlotsService,
    private readonly dermatologistsService: DermatologistsService,
  ) {}

  @Post()
  async createSlots(@GetUser() user: User, @Body() dto: CreateAvailabilityDto) {
    const dermatologistId = await this.getDermatologistId(user.userId);
    const result = await this.availabilitySlotsService.createMySlots(
      dermatologistId,
      dto,
    );
    return ResponseHelper.created(result.message, result);
  }

  @Get()
  async getSlots(
    @GetUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const dermatologistId = await this.getDermatologistId(user.userId);
    const slots = await this.availabilitySlotsService.getMySlots(
      dermatologistId,
      startDate,
      endDate,
    );

    return ResponseHelper.success('Slots retrieved successfully', slots);
  }

  @Delete(':slotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelSlot(
    @GetUser() user: User,
    @Param('slotId', new ParseUUIDPipe()) slotId: string,
  ) {
    const dermatologistId = await this.getDermatologistId(user.userId);
    await this.availabilitySlotsService.cancelMySlot(dermatologistId, slotId);
  }

  private async getDermatologistId(userId: string): Promise<string> {
    const dermatologist = await this.dermatologistsService.findByUserId(userId);
    return dermatologist.dermatologistId;
  }
}
