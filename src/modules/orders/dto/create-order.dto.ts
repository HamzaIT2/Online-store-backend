import { IsNumber, IsNotEmpty, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Product ID' })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: 'Total price' })
  @IsNumber()
  @IsPositive()
  totalPrice: number;
}
