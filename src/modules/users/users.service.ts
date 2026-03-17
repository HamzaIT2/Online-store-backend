import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { Product } from '../products/entities/product.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Favorite } from '../favorites/entities/favorite.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
  ) { }

  async findAll(page: number = 1, limit: number = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      where: { isActive: true },
      relations: ['province', 'city'],
      select: {
        userId: true,
        username: true,
        fullName: true,
        fullNameAr: true,
        profileImage: true,
        isVerified: true,
        ratingAverage: true,
        totalSales: true,
        createdAt: true,
        // Exclude sensitive fields
        email: false,
        phoneNumber: false,
        passwordHash: false,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { userId: id, isActive: true },
      relations: ['province', 'city'],
      select: {
        userId: true,
        username: true,
        fullName: true,
        fullNameAr: true,
        profileImage: true,
        address: true,
        isVerified: true,
        ratingAverage: true,
        totalSales: true,
        createdAt: true,
        // Exclude sensitive fields
        email: false,
        phoneNumber: false,
        passwordHash: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string) {
    const user = await this.userRepository.findOne({
      where: { username, isActive: true },
      relations: ['province', 'city'],
      select: {
        userId: true,
        username: true,
        fullName: true,
        fullNameAr: true,
        profileImage: true,
        address: true,
        isVerified: true,
        ratingAverage: true,
        totalSales: true,
        createdAt: true,
        // Exclude sensitive fields
        email: false,
        phoneNumber: false,
        passwordHash: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getProfile(userId: number) {
    // Get full profile including sensitive data (for the user themselves)
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['province', 'city'],
      select: {
        userId: true,
        username: true,
        email: true,
        fullName: true,
        fullNameAr: true,
        phoneNumber: true,
        profileImage: true,
        address: true,
        isVerified: true,
        isActive: true,
        ratingAverage: true,
        totalSales: true,
        role: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive fields
        passwordHash: false,
        resetPasswordToken: false,
        resetPasswordExpiry: false,
        verificationCode: false,
        verificationCodeExpiry: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser: User) {
    // Users can only update their own profile
    if (currentUser.userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    return this.getProfile(id);
  }

  async deactivate(id: number, currentUser: User) {
    // Users can only deactivate their own account
    if (currentUser.userId !== id) {
      throw new ForbiddenException('You can only deactivate your own account');
    }

    const user = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    await this.userRepository.save(user);

    return { message: 'Account deactivated successfully' };
  }

  async getUserStats(userId: number): Promise<UserStatsDto> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get total sales from completed transactions where user is seller
    const totalSalesResult = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.price)', 'total')
      .where('transaction.sellerId = :userId', { userId })
      .andWhere('transaction.status = :status', { status: 'completed' })
      .getRawOne();

    const totalSales = parseFloat(totalSalesResult?.total || '0');

    // Get total products count for the user
    const totalProducts = await this.productRepository.count({
      where: { sellerId: userId },
    });

    // Get total purchases count where user is buyer and transaction is completed
    const totalPurchases = await this.transactionRepository.count({
      where: {
        buyerId: userId,
        status: 'completed',
      },
    });

    // Get favorite products count
    const favoriteCount = await this.favoriteRepository.count({
      where: { userId },
    });

    return {
      totalSales,
      totalProducts,
      totalPurchases,
      favoriteCount,
    };
  }
}