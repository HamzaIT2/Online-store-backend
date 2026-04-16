import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) { }

  async findUserOrders(userId: number): Promise<Order[]> {
    console.log('Finding orders for userId:', userId);
    console.log('Type of userId:', typeof userId);

    const orders = await this.orderRepository.find({
      where: { userId },
      relations: ['product', 'product.seller', 'product.images'],
      order: { createdAt: 'DESC' },
    });

    console.log('Found orders:', orders);
    console.log('Number of orders found:', orders.length);

    return orders;
  }

  async createOrder(userId: number, productId: number, totalPrice: number): Promise<Order> {
    console.log('Creating order with:', { userId, productId, totalPrice });

    const order = this.orderRepository.create({
      userId,
      productId,
      totalPrice,
    });

    const savedOrder = await this.orderRepository.save(order);
    console.log('Order saved:', savedOrder);

    return savedOrder;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    order.status = status as any;
    return await this.orderRepository.save(order);
  }
}
