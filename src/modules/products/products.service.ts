import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Product } from './entities/product.entity';
import { Image } from '../images/entities/image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { User } from '../users/entities/user.entity';
import { RatingsService } from '../../ratings/ratings.service';
import { VipService } from '../../vip/vip.service';

interface ProductFilters {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    private ratingsService: RatingsService,
    private vipService: VipService,
  ) {}

  async getHeroSlides() {
    const now = new Date();
    this.logger.log('Fetching VIP hero slides...');
    return this.vipService.getHeroSlides();
  }
  async getPlans() {
    return this.vipService.getPlans();
  }

  async promoteProduct(productId: number, planId: number) {
    return this.vipService.promoteProduct(productId, planId);
  }

  async findAllAvailable() {
    return await this.productRepository.find({
      where: { status: 'available' },
      relations: ['seller', 'category']
    });
  }

  // 2. Create product with image saving
  async create(
    createProductDto: CreateProductDto,
    user: User,
    images: Array<Express.Multer.File>,
  ): Promise<Product> {
    const product = this.productRepository.create({
      ...createProductDto,
      seller: user, // Link with User entity directly
    });
    const newProduct = await this.productRepository.save(product);

    if (images && images.length > 0) {
      const imageEntities = images.map((file, index) => {
        return this.imageRepository.create({
          url: `/uploads/${file.filename}`,
          product: newProduct,
          isPrimary: index === 0,
          displayOrder: index,
        });
      });
      await this.imageRepository.save(imageEntities);
    }

    return this.findOne(newProduct.productId);
  }

  // 3. Get all products with pagination
  async findAll(page: number = 1, limit: number = 20, filters: ProductFilters = {}) {

    const queryOptions: any = {
      relations: ['seller', 'category', 'province', 'city', 'images'],
      where: {},
    };

    // 1. Filter by Category if provided - using direct column reference
    if (filters.categoryId) {
      queryOptions.where.categoryId = filters.categoryId;
    }

    // 2. Filter by Search if provided
    if (filters.search) {
      queryOptions.where.title = Like(`%${filters.search}%`);
    }

    // 3. Filter by Price if provided
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      queryOptions.where.price = MoreThanOrEqual(filters.minPrice);
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      queryOptions.where.price = LessThanOrEqual(filters.maxPrice);
    }

    // 4. Filter by Condition if provided
    if (filters.condition) {
      queryOptions.where.condition = filters.condition;
    }

    // 5. Always filter by available status
    queryOptions.where.status = 'available';

    // 6. Add ordering and pagination
    queryOptions.order = { createdAt: 'DESC' };
    queryOptions.skip = (page - 1) * limit;
    queryOptions.take = limit;

    const [products, total] = await this.productRepository.findAndCount(queryOptions);


    const sellerIds = Array.from(new Set(products.map(p => p.seller?.userId).filter(Boolean)));
    const ratingsMap = await this.ratingsService.getRatingsByUserIds(sellerIds as number[]);
    const data = products.map(p => ({
      ...p,
      ratingAverage: ratingsMap[p.seller?.userId ?? -1]?.avg ?? 0,
      ratingCount: ratingsMap[p.seller?.userId ?? -1]?.count ?? 0,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // 4. Get single product with relations
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { productId: id },
      relations: ['seller', 'category', 'province', 'city', 'images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.productRepository.increment({ productId: id }, 'viewCount', 1);

    return product;
  }

  // 5. Update product
  async update(id: number, updateProductDto: UpdateProductDto, user: User): Promise<Product> {
    const product = await this.findOne(id);

    // Check if user owns the product
    if (product.sellerId !== user.userId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Don't allow status changes through update (use specific endpoints for that)
    const { status, ...allowedUpdates } = updateProductDto;

    await this.productRepository.update(id, allowedUpdates);

    return this.findOne(id);
  }

  // 6. Delete product
  async remove(id: number, user: User): Promise<void> {
    const product = await this.findOne(id);

    // Check if user owns the product
    if (product.sellerId !== user.userId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    // Only allow deletion if product is not sold
    if (product.status === 'sold') {
      throw new ForbiddenException('Cannot delete a sold product');
    }

    await this.productRepository.delete(id);
    this.logger.log(`Product ${id} deleted by user ${user.userId}`);
  }

  // 7. Search products
  async searchProducts(query: string, page: number = 1, limit: number = 20) {
    const q = `%${query.toLowerCase()}%`;

    // Use LOWER(...) + LIKE for DB-agnostic case-insensitive matching (works on Postgres and MySQL)
    // Also align status filter with the entity default value ('available')
    const [products, total] = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .where(
        '(LOWER(product.title) LIKE LOWER(:query) OR LOWER(product.description) LIKE LOWER(:query)) AND product.status = :status',
        { query: q, status: 'available' },
      )
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        lastPage: 0,
      },
    };
  }

  // 8. Filter products (legacy method for backward compatibility)
  async filterProducts(
    categoryId?: number,
    provinceId?: number,
    cityId?: number,
    minPrice?: number,
    maxPrice?: number,
    condition?: string,
    search?: string,
    page?: number,
    limit?: number,
  ) {
    const filters: ProductFilters = {
      categoryId,
      search,
      minPrice,
      maxPrice,
      condition,
    };

    return this.findAll(page || 1, limit || 20, filters);
  }

  // 9. Get products by user
  async findByUser(userId: number, page?: number, limit?: number) {
    const queryOptions: any = {
      where: { sellerId: userId },
      relations: ['category', 'images'],
      order: { createdAt: 'DESC' },
    };

    if (page && limit) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    const products = await this.productRepository.find(queryOptions);

    return {
      data: products,
      pagination: {
        page: page || 1,
        limit: limit || products.length,
        total: products.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  // 10. Get products by seller (alias for findByUser)
  async findBySeller(sellerId: number) {
    return await this.productRepository.find({
      where: { sellerId },
      relations: ['category', 'images'],
      order: { createdAt: 'DESC' },
    });
  }

  // 11. Mark product as sold
  async markAsSold(productId: number, buyerId: number, sellerId: number) {
    const product = await this.findOne(productId);

    // Check if product is available
    if (product.status !== 'available') {
      throw new ForbiddenException('Product is not available for purchase');
    }

    // Check if seller is the owner
    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('Only the seller can mark a product as sold');
    }

    // Update product status
    await this.productRepository.update(productId, {
      status: 'sold',
      buyerId,
      soldAt: new Date(),
    });

    this.logger.log(`Product ${productId} marked as sold to user ${buyerId}`);

    return this.findOne(productId);
  }

  // 12. Update product images
  async updateProductImages(productId: number, images: Array<Express.Multer.File>, user: User) {
    const product = await this.findOne(productId);

    // Check if user owns the product
    if (product.sellerId !== user.userId) {
      throw new ForbiddenException('You can only update your own product images');
    }

    // Delete existing images
    await this.imageRepository.delete({ productId });

    // Save new images
    if (images && images.length > 0) {
      const imageEntities = images.map((file, index) => {
        return this.imageRepository.create({
          url: `/uploads/${file.filename}`,
          productId,
          isPrimary: index === 0,
          displayOrder: index,
        });
      });
      await this.imageRepository.save(imageEntities);
    }

    this.logger.log(`Updated images for product ${productId}`);

    return this.findOne(productId);
  }

  // 13. Toggle product status
  async toggleProductStatus(productId: number, user: User) {
    const product = await this.findOne(productId);

    // Check if user owns the product
    if (product.sellerId !== user.userId) {
      throw new ForbiddenException('You can only change your own product status');
    }

    const newStatus = product.status === 'available' ? 'unavailable' : 'available';

    await this.productRepository.update(productId, { status: newStatus });

    this.logger.log(`Product ${productId} status changed to ${newStatus}`);

    return this.findOne(productId);
  }

  // 14. Get VIP products
  async getVipProducts() {
    const now = new Date();
    return await this.productRepository.find({
      where: { 
        isVip: true, 
        status: 'available',
        vipExpiryDate: MoreThanOrEqual(now)
      },
      relations: ['seller', 'category', 'images'],
      order: { vipExpiryDate: 'DESC' },
      take: 10,
    });
  }

  // 15. Check VIP status
  async checkVipStatus(productId: number) {
    const product = await this.findOne(productId);

    if (!product.isVip || !product.vipExpiryDate) {
      return { isVip: false };
    }

    const now = new Date();
    const isExpired = product.vipExpiryDate < now;

    if (isExpired) {
      // Auto-expire VIP status
      await this.productRepository.update(productId, {
        isVip: false,
        vipExpiryDate: null,
      });

      return { isVip: false };
    }

    const daysRemaining = Math.ceil(
      (product.vipExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      isVip: true,
      expiryDate: product.vipExpiryDate,
      daysRemaining,
    };
  }
}
