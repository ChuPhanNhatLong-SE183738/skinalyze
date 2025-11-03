import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { DermatologistsService } from './dermatologists.service';
import {
  CreateDermatologistDto,
  UpdateDermatologistDto,
} from './dto/create-dermatologist.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AvailabilitySlotsService } from 'src/availability-slots/availability-slots.service';
import { SlotStatus } from 'src/availability-slots/entities/availability-slot.entity';
import { ResponseHelper } from 'src/utils/responses';

@ApiTags('Dermatologists')
@Controller('dermatologists')
export class DermatologistsController {
  constructor(
    private readonly dermatologistsService: DermatologistsService,
    private readonly availabilitySlotsService: AvailabilitySlotsService,
  ) {}

  // CRUD Operations for Dermatologist
  @Post()
  @ApiOperation({ summary: 'Create a dermatologist profile' })
  @ApiCreatedResponse({ description: 'Dermatologist created successfully' })
  async create(
    @Body() createDermatologistDto: CreateDermatologistDto,
  ): Promise<unknown> {
    const dermatologist = await this.dermatologistsService.create(
      createDermatologistDto,
    );
    return ResponseHelper.created(
      'Dermatologist created successfully',
      dermatologist,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get the list of dermatologists' })
  @ApiOkResponse({ description: 'Dermatologists retrieved successfully' })
  async findAll(): Promise<unknown> {
    const dermatologists = await this.dermatologistsService.findAll();
    return ResponseHelper.success(
      'Dermatologists retrieved successfully',
      dermatologists,
    );
  }

  @Get(':dermatologistId/availability')
  @ApiOperation({ summary: 'Get available slots for a specific dermatologist' })
  @ApiOkResponse({ description: 'Availability slots retrieved' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'ISO 8601 timestamp marking the start of the search window',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'ISO 8601 timestamp marking the end of the search window',
  })
  async getDermatologistAvailability(
    @Param('dermatologistId', new ParseUUIDPipe()) dermatologistId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const slots = await this.availabilitySlotsService.getMySlots(
      dermatologistId,
      startDate,
      endDate,
      SlotStatus.AVAILABLE,
    );

    return ResponseHelper.success('Available slots retrieved', slots);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dermatologist details' })
  @ApiOkResponse({ description: 'Dermatologist retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<unknown> {
    const dermatologist = await this.dermatologistsService.findOne(id);
    return ResponseHelper.success(
      'Dermatologist retrieved successfully',
      dermatologist,
    );
  }

  @Patch(':id')
  @Roles(UserRole.DERMATOLOGIST)
  @ApiOperation({ summary: 'Update dermatologist profile' })
  @ApiOkResponse({ description: 'Dermatologist updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateDermatologistDto: UpdateDermatologistDto,
  ): Promise<unknown> {
    const dermatologist = await this.dermatologistsService.update(
      id,
      updateDermatologistDto,
    );
    return ResponseHelper.success(
      'Dermatologist updated successfully',
      dermatologist,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete dermatologist profile' })
  @ApiOkResponse({ description: 'Dermatologist deleted successfully' })
  async remove(@Param('id') id: string): Promise<unknown> {
    await this.dermatologistsService.remove(id);
    return ResponseHelper.success('Dermatologist deleted successfully');
  }
}
