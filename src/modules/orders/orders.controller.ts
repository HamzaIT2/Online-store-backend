import {
  Controller,
  Get,
  Post,
  UseGuards,
  Logger,
  Req,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) { }

  private extractUserId(user: User | any): number {
    console.log('Extracting userId from user object:', user);

    // Try multiple possible user ID properties
    if (user && user.userId) {
      console.log('Found userId property:', user.userId);
      return user.userId;
    }

    if (user && user.id) {
      console.log('Found id property:', user.id);
      return user.id;
    }

    if (user && user.sub) {
      console.log('Found sub property:', user.sub);
      return user.sub;
    }

    console.error('No user ID found in user object:', user);
    throw new Error('User ID not found in authenticated user object');
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyOrders(@CurrentUser() user: User) {
    console.log('User object in getMyOrders:', user);
    const userId = this.extractUserId(user);
    this.logger.log(`Fetching orders for user ${userId}`);
    return await this.ordersService.findUserOrders(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createOrder(@CurrentUser() user: User, @Body() orderDto: CreateOrderDto) {
    console.log('User object in createOrder:', user);
    const userId = this.extractUserId(user);
    console.log('Order received:', orderDto);
    this.logger.log(`Creating order for user ${userId} with product ${orderDto.productId}`);
    return await this.ordersService.createOrder(userId, orderDto.productId, orderDto.totalPrice);
  }
}
