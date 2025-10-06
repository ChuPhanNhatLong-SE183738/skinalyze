import { PartialType } from '@nestjs/swagger';
import { CreateStockMovementDto } from './create-stock-movement.dto';

export class UpdateStockMovementDto extends PartialType(CreateStockMovementDto) {}
