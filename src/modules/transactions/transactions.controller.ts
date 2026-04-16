import { Controller, Get, Post, Query, UseGuards, Body, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List my transactions with optional filters' })
  @ApiQuery({ name: 'counterpartyUserId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @CurrentUser() user: User,
    @Query('counterpartyUserId') counterpartyUserId?: number,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionsService.listForUser(user.userId, {
      counterpartyUserId: counterpartyUserId ? Number(counterpartyUserId) : undefined,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a purchase transaction' })
  @ApiBody({ type: CreatePurchaseDto })
  async createPurchase(
    @CurrentUser() user: User,
    @Body() createPurchaseDto: CreatePurchaseDto,
  ) {
    return this.transactionsService.createTransaction(
      createPurchaseDto.productId,
      user.userId,
      createPurchaseDto.paymentMethod,
    );
  }

  @Get('purchase-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my purchase history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPurchaseHistory(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionsService.getPurchaseHistory(
      user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('sold-products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my sold products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSoldProducts(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionsService.getSoldProducts(
      user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
