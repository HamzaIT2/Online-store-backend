import { Controller, Get, Post, Param, Body, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VipService } from './vip.service';

@ApiTags('VIP')
@Controller('vip')
export class VipController {
  constructor(private readonly vipService: VipService) {}

  @Get('hero-slides')
  @ApiOperation({ summary: 'Get VIP hero slides for homepage' })
  @ApiResponse({ status: 200, description: 'VIP slides retrieved successfully' })
  async getHeroSlides() {
    return this.vipService.getHeroSlides();
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available VIP plans' })
  @ApiResponse({ status: 200, description: 'VIP plans retrieved successfully' })
  async getPlans() {
    return this.vipService.getPlans();
  }

  @Post('promote/:id')
  @ApiOperation({ summary: 'Promote a product to VIP status' })
  @ApiResponse({ status: 200, description: 'Product promoted successfully' })
  @ApiResponse({ status: 404, description: 'Product or VIP plan not found' })
  async promoteProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body('planId', ParseIntPipe) planId: number,
  ) {
    return this.vipService.promoteProduct(id, planId);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get VIP products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return' })
  @ApiResponse({ status: 200, description: 'VIP products retrieved successfully' })
  async getVipProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.vipService.getVipProducts(limit);
  }
}
