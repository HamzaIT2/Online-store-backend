import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({
    description: 'مجموع سعر المنتجات المباعة للمستخدم',
    example: 15000.50,
    type: 'number',
  })
  totalSales: number;

  @ApiProperty({
    description: 'عدد المنتجات التي أضافها المستخدم',
    example: 25,
    type: 'number',
  })
  totalProducts: number;

  @ApiProperty({
    description: 'عدد المشتريات التي قام بها المستخدم',
    example: 10,
    type: 'number',
  })
  totalPurchases: number;

  @ApiProperty({
    description: 'عدد المنتجات المفضلة للمستخدم',
    example: 8,
    type: 'number',
  })
  favoriteCount: number;
}
