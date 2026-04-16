import { IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsOptional()
  buyerId?: number;
}
