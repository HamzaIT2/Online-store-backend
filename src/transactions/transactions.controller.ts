import { Controller, Post, Get, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) { }

  @Post()
  async createTransaction(@Body() body: CreateTransactionDto, @Request() req) {
    this.logger.log('=== Transaction Request ===');
    this.logger.log('Request body:', body);
    this.logger.log('Request user:', req.user);

    try {
      // Use buyerId from request body, fallback to authenticated user if not provided
      const buyerId = body.buyerId || req.user?.id || req.user?.userId;
      this.logger.log('Using buyerId:', buyerId);

      if (!buyerId) {
        throw new Error('Buyer ID is required');
      }

      const result = await this.transactionsService.createTransaction(
        body.productId,
        body.amount,
        buyerId
      );
      return {
        success: true,
        data: result,
        message: 'Product purchased successfully'
      };
    } catch (error) {
      console.error('Transaction error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get('purchase-history')
  async getPurchaseHistory(@Request() req) {
    //console.log('=== Purchase History Request ===');
    const userId = req.user?.id || req.user?.userId;
    //console.log('User ID:', userId);

    const purchases = await this.transactionsService.getPurchaseHistory(userId);
    this.logger.log('Found purchases:', purchases.length);

    return {
      success: true,
      data: purchases
    };
  }

  @Get('sold-products')
  async getSoldProducts(@Request() req) {
    this.logger.log('=== Sold Products Request ===');
    const userId = req.user?.id || req.user?.userId;
   // console.log('User ID:', userId);

    const soldProducts = await this.transactionsService.getSoldProducts(userId);
    this.logger.log('Found sold products:', soldProducts.length);

    return {
      success: true,
      data: soldProducts
    };
  }
}
