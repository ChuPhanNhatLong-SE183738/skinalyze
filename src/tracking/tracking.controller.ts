import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseHelper } from '../utils/responses';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '📤 Shipper gửi vị trí và tự động tính ETA',
    description: 'API để shipper app gửi vị trí GPS, backend sẽ tự động tính ETA và broadcast cho customer',
  })
  async updateLocation(
    @Body() updateLocationDto: UpdateLocationDto,
    @Request() req,
  ) {
    const { orderId, lat, lng, timestamp } = updateLocationDto;
    const userId = req.user.userId;

    const location = {
      lat,
      lng,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Lấy địa chỉ khách hàng
    const customerLocation = await this.trackingService.getCustomerLocation(orderId);

    if (!customerLocation) {
      return ResponseHelper.error(
        404,
        'Không tìm thấy địa chỉ khách hàng',
        null,
      );
    }

    // Tính ETA ngay
    const eta = await this.trackingService.calculateETA(location, customerLocation);

    // Broadcast qua WebSocket cho customer
    const gateway = this.trackingService['trackingGateway'];
    if (gateway && gateway.server) {
      const room = `order_${orderId}`;
      
      // Gửi vị trí shipper
      gateway.server.to(room).emit('shipperMoved', {
        orderId,
        location,
        timestamp: location.timestamp,
      });

      // Gửi ETA
      if (eta) {
        gateway.server.to(room).emit('updateETA', {
          orderId,
          eta,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return ResponseHelper.success('Cập nhật vị trí và ETA thành công', {
      orderId,
      location,
      eta,
      message: 'Vị trí và ETA đã được gửi đến khách hàng',
    });
  }
}
