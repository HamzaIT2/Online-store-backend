import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductCondition } from './get-products.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 13 Pro' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Used iPhone in excellent condition, 256GB' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 850000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  categoryId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  provinceId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  cityId: number;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 900000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  oldPrice?: number;

  @ApiProperty({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  offerExpiresAt?: Date;

  @ApiProperty({ required: false, enum: ProductCondition, example: ProductCondition.LIKE_NEW })
  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @ApiProperty({ required: false, enum: ['active', 'sold', 'inactive'], example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'sold', 'inactive'])
  status?: 'active' | 'sold' | 'inactive';
}