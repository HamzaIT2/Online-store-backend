import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Product } from '../products/entities/product.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Product]), OrdersModule],
  providers: [TransactionsService],
  controllers: [TransactionsController]
})
export class TransactionsModule { }
