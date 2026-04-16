import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Product } from '../products/entities/product.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) { }

  async createTransaction(productId: number, buyerId: number, paymentMethod?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the product row to prevent concurrent purchases
      const product = await queryRunner.manager.findOne(Product, {
        where: { productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.status !== 'available') {
        throw new BadRequestException('Product is no longer available');
      }

      if (product.sellerId === buyerId) {
        throw new ForbiddenException('You cannot purchase your own product');
      }

      // Create transaction
      const transaction = queryRunner.manager.create(Transaction, {
        productId,
        buyerId,
        sellerId: product.sellerId,
        price: product.price,
        paymentMethod,
        status: 'completed',
        completedAt: new Date(),
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      // Update product status and buyer information
      await queryRunner.manager.update(Product, productId, {
        status: 'sold',
        buyerId,
        soldAt: new Date(),
        purchaseId: savedTransaction.transactionId,
      });

      // Create order record within the same transaction
      const newOrder = queryRunner.manager.create(Order, {
        userId: buyerId,
        productId: productId,
        totalPrice: product.price,
        status: OrderStatus.COMPLETED,
        transactionId: savedTransaction.transactionId,
      });
      await queryRunner.manager.save(newOrder);

      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listForUser(currentUserId: number, opts: { counterpartyUserId?: number; status?: string; page?: number; limit?: number } = {}) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 100) : 20;

    const qb = this.txRepo
      .createQueryBuilder('t')
      .where('(t.buyerId = :me OR t.sellerId = :me)', { me: currentUserId });

    if (opts.counterpartyUserId) {
      qb.andWhere('(t.buyerId = :cp OR t.sellerId = :cp)', { cp: opts.counterpartyUserId });
    }
    if (opts.status) {
      qb.andWhere('t.status = :status', { status: opts.status });
    }

    const [items, total] = await qb
      .orderBy('t.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, lastPage: Math.ceil(total / limit) };
  }

  async getPurchaseHistory(buyerId: number, page: number = 1, limit: number = 20) {
    const [transactions, total] = await this.txRepo.findAndCount({
      where: { buyerId },
      relations: ['product', 'product.images', 'seller'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: transactions,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getSoldProducts(sellerId: number, page: number = 1, limit: number = 20) {
    const [products, total] = await this.productRepo.findAndCount({
      where: { sellerId, status: 'sold' },
      relations: ['buyer', 'images', 'category'],
      order: { soldAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: products,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
