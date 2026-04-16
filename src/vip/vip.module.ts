import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VipService } from './vip.service';
import { VipController } from './vip.controller';
import { Product } from '../modules/products/entities/product.entity';
import { VipPlan } from '../modules/vip-plan/entities/vip-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, VipPlan])],
  controllers: [VipController],
  providers: [VipService],
  exports: [VipService],
})
export class VipModule {}
