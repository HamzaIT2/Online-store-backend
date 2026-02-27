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
  
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';import { FilesInterceptor } from '@nestjs/platform-express';


@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
  console.log('Controller received DTO:', createProductDto);
  console.log('User creating product:', user);
  // ✅ الحل: استخدام متغير 'images' الصحيح
  console.log('Number of images received:', images ? images.length : 0);
  
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
  @ApiOperation({ summary: 'Get all active products with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.productsService.findAll(page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by title or description' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Products found' })
  search(
    @Query('q') query: string,
    @Query('page',new DefaultValuePipe(1),ParseIntPipe) page?: number,
    @Query('limit',new DefaultValuePipe(20),ParseIntPipe) limit?: number,
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
  @ApiQuery({ name: 'condition', required: false, enum: ['new', 'like_new', 'good', 'fair', 'poor'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Filtered products' })
  filter(
    @Query('categoryId') categoryId?: number,
    @Query('provinceId') provinceId?: number,
    @Query('cityId') cityId?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('condition') condition?: string,
    @Query('page',new DefaultValuePipe(1),ParseIntPipe) page?: number,
    @Query('limit',new DefaultValuePipe(20),ParseIntPipe) limit?: number,
  ) {
    return this.productsService.filterProducts(
      categoryId,
      provinceId,
      cityId,
      minPrice,
      maxPrice,
      condition,
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
    @Query('page',new DefaultValuePipe(1),ParseIntPipe) page?: number,
    @Query('limit',new DefaultValuePipe(20),ParseIntPipe) limit?: number,
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
    console.log('Update Data Received:', updateProductDto);
    console.log('User:', user);
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

