import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsDto, ProductCondition } from './dto/get-products.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) { }

  @Get('hero-slides')
  async getHero() {
    return this.productsService.getHeroSlides();
  }

  @Get('plans/all')
  async getAllPlans() {
    return this.productsService.getPlans();
  }
  @Post('promote/:id')
  async promoteProduct(
    @Param('id') id: string,
    @Body('planId') planId: number,
  ) {
    return this.productsService.promoteProduct(+id, planId);
  }


  // products.controller.ts

  // ... (imports)

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Create a new product with images' })
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User,
    // ✅ الحل: استقبال الملفات كمعامل (parameter) في الدالة
    @UploadedFiles() images: Array<Express.Multer.File>,
  ) {
    this.logger.log('Controller received DTO:', createProductDto);
    this.logger.log('User creating product:', user);
    // ✅ الحل: استخدام متغير 'images' الصحيح
    this.logger.log('Number of images received:', images ? images.length : 0);

    // ✅ الحل: إرسال متغير 'images' الصحيح إلى الـ Service
    return this.productsService.create(createProductDto, user, images);
  }

  // ... (باقي دوال الـ Controller)


  //  @Post()
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth('JWT-auth')
  //   @UseInterceptors(FilesInterceptor('images', 10))
  //   @ApiOperation({ summary: 'Create a new product (requires authentication)' })
  //   @ApiResponse({ status: 201, description: 'Product successfully created' })
  //   @ApiResponse({ status: 401, description: 'Unauthorized' })
  //   create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: User) {
  //     @UploadedFiles()images: Array<Express.Multer.File>
  //     console.log('Controller received DTO:', createProductDto);
  //   console.log('User creating product:', user);
  //   console.log('Controller received DTO:', createProductDto);
  //   console.log('User creating product:', user);
  //   console.log('Number of images received:', Image.length);
  //     return this.productsService.create(createProductDto, user,Image);
  //   }

  @Get()
  @ApiOperation({ summary: 'Get all active products with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: 'Filter by category' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'condition', required: false, type: String, description: 'Product condition filter' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number,
    @Query('search') search?: string,
    @Query('minPrice', new ParseIntPipe({ optional: true })) minPrice?: number,
    @Query('maxPrice', new ParseIntPipe({ optional: true })) maxPrice?: number,
    @Query('condition') condition?: string,
  ) {
    //console.log('CONTROLLER - Received query params:', { page, limit, categoryId, search, minPrice, maxPrice, condition });

    const filters = { categoryId, search, minPrice, maxPrice, condition };
    //console.log('CONTROLLER - Extracted filters:', filters);
    //console.log('CONTROLLER - CategoryId filter:', categoryId);

    const result = this.productsService.findAll(page, limit, filters);
    //console.log('CONTROLLER - Sending to service with filters:', filters);

    return result;
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by title or description' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Products found' })
  search(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.productsService.searchProducts(query, page, limit);
  }

  @Get('filter')
  @ApiOperation({ summary: 'Filter products by category, location, price, and condition' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'provinceId', required: false, type: Number })
  @ApiQuery({ name: 'cityId', required: false, type: Number })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'condition', required: false, enum: ProductCondition })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Filtered products' })
  filter(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: GetProductsDto,
  ) {
    const { page = 1, limit = 20, ...filters } = query;
    return this.productsService.filterProducts(
      filters.categoryId,
      filters.provinceId,
      filters.cityId,
      filters.minPrice,
      filters.maxPrice,
      filters.condition,
      filters.search,
      page,
      limit,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all products by a specific user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User products retrieved' })
  findByUser(
    @Param('userId') userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.productsService.findByUser(userId, page, limit);
  }



  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: number) {
    return this.productsService.findOne(id);
  }



  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a product (only owner can update)' })
  @ApiResponse({ status: 200, description: 'Product successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: User,
  ) {
    this.logger.log('Update Data Received:', updateProductDto);
    this.logger.log('User:', user);
    return this.productsService.update(id, updateProductDto, user);
  }


  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a product (only owner can delete)' })
  @ApiResponse({ status: 200, description: 'Product successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: number, @CurrentUser() user: User) {
    return this.productsService.remove(id, user);
  }
}

