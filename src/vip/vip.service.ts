import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Product } from '../modules/products/entities/product.entity';
import { VipPlan } from '../modules/vip-plan/entities/vip-plan.entity';

export interface VipSlide {
  productId: number;
  title: string;
  vipExpiryDate: Date;
  images: any[];
}

@Injectable()
export class VipService {
  private readonly logger = new Logger(VipService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(VipPlan)
    private vipPlanRepository: Repository<VipPlan>,
  ) {}

  async getHeroSlides(): Promise<VipSlide[]> {
    const now = new Date();
    this.logger.log('Fetching VIP hero slides...');
    
    const slides = await this.productRepository.find({
      where: {
        isVip: true,
        vipExpiryDate: MoreThan(now),
      },
      order: { vipExpiryDate: 'DESC' },
      relations: ['images'],
      take: 5,
    });
    
    this.logger.log(`Found ${slides.length} active VIP slides`);
    return slides;
  }

  async getPlans(): Promise<VipPlan[]> {
    this.logger.log('Fetching VIP plans...');
    const plans = await this.vipPlanRepository.find();
    this.logger.log(`Found ${plans.length} VIP plans`);
    return plans;
  }

  async promoteProduct(productId: number, planId: number): Promise<{ message: string }> {
    this.logger.log(`Promoting product ${productId} with plan ${planId}`);
    
    const plan = await this.vipPlanRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('VIP plan not found');
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.days);

    await this.productRepository.update(productId, {
      isVip: true,
      vipExpiryDate: expiryDate,
    });

    this.logger.log(`Product ${productId} promoted until ${expiryDate}`);
    return { message: 'Product promoted successfully' };
  }

  async getVipProducts(limit: number = 10): Promise<Product[]> {
    const now = new Date();
    return this.productRepository.find({
      where: {
        isVip: true,
        vipExpiryDate: MoreThan(now),
      },
      order: { vipExpiryDate: 'DESC' },
      relations: ['seller', 'category', 'province', 'city', 'images'],
      take: limit,
    });
  }
}
