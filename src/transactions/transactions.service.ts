import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Product } from '../modules/products/entities/product.entity';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) { }

  async createTransaction(productId: number, amount: number, buyerId: number) {
    this.logger.log('=== Creating Transaction ===');
    this.logger.log(`Product ID: ${productId}, Amount: ${amount}, Buyer ID: ${buyerId}`);

    return await this.dataSource.transaction(async manager => {
      // Lock product to prevent concurrent purchases
      const product = await manager.findOne(Product, {
        where: { productId: productId },
        lock: { mode: 'pessimistic_write' }
      });

      this.logger.log('Found product:', product);

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.status !== 'available') {
        throw new Error('Product is not available for purchase');
      }

      this.logger.log('Product sellerId:', product.sellerId);
      this.logger.log('Request buyerId:', buyerId);

      if (product.sellerId === buyerId) {
        throw new Error('Cannot purchase your own product');
      }

      // Create transaction
      const transaction = manager.create(Transaction, {
        productId,
        buyerId,
        sellerId: product.sellerId,
        amount,
        status: 'completed'
      });

      const savedTransaction = await manager.save(transaction);
      this.logger.log('Saved transaction:', savedTransaction);

      // Update product status
      await manager.update(Product, productId, {
        status: 'sold',
        buyerId: buyerId,
        soldAt: new Date(),
        purchaseId: savedTransaction.id
      });

      this.logger.log('Updated product with buyerId:', buyerId);
      return savedTransaction;
    });
  }

  async getPurchaseHistory(buyerId: number) {
    return await this.dataSource.getRepository(Transaction)
      .find({
        where: { buyerId },
        relations: ['product', 'seller'],
        order: { createdAt: 'DESC' }
      });
  }

  async getSoldProducts(sellerId: number) {
    return await this.dataSource.getRepository(Transaction)
      .find({
        where: { sellerId },
        relations: ['product', 'buyer'],
        order: { createdAt: 'DESC' }
      });
  }
}
