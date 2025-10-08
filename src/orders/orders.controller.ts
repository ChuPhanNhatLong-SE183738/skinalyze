import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseHelper } from '../utils/responses';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '🛒 Checkout cart - Convert cart items to order' })
  async checkout(@Req() req, @Body() checkoutDto: CheckoutCartDto) {
    console.log('🔍 DEBUG - req.user:', req.user); // Debug log
    const userId = req.user.userId; // Lấy userId từ JWT token
    console.log('🔍 DEBUG - userId:', userId); // Debug log
    const order = await this.ordersService.checkoutCart(userId, checkoutDto);
    return ResponseHelper.success(
      'Cart checkout successfully, order created',
      order,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Body() createDto: CreateOrderDto) {
    const order = await this.ordersService.create(createDto);
    return ResponseHelper.success('Order created successfully', order);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'customerId', required: false })
  async findAll(@Query('customerId') customerId?: string) {
    const orders = customerId
      ? await this.ordersService.findByCustomerId(customerId)
      : await this.ordersService.findAll();
    return ResponseHelper.success('Orders retrieved successfully', orders);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an order by ID' })
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    return ResponseHelper.success('Order retrieved successfully', order);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an order' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateOrderDto) {
    const order = await this.ordersService.update(id, updateDto);
    return ResponseHelper.success('Order updated successfully', order);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an order' })
  async cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    const order = await this.ordersService.cancelOrder(id, reason);
    return ResponseHelper.success('Order cancelled successfully', order);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm an order' })
  async confirm(
    @Param('id') id: string,
    @Body('processedBy') processedBy: string,
  ) {
    const order = await this.ordersService.confirmOrder(id, processedBy);
    return ResponseHelper.success('Order confirmed successfully', order);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an order' })
  async remove(@Param('id') id: string) {
    await this.ordersService.remove(id);
    return ResponseHelper.success('Order deleted successfully');
  }
}
