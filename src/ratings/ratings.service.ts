import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../modules/reviews/entities/review.entity';
import { UserRating } from './interfaces/user-rating.interface';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) { }

  async getRatingsByUserIds(userIds: number[]): Promise<Record<number, UserRating>> {
    if (!userIds || userIds.length === 0) return {} as Record<number, UserRating>;

    const rows = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.reviewedUserId', 'reviewedUserId')
      .addSelect('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.reviewId)', 'count')
      .where('review.reviewedUserId IN (:...ids)', { ids: userIds })
      .groupBy('review.reviewedUserId')
      .getRawMany<{ reviewedUserId: string; avg: string; count: string }>();

    const ratingsMap: Record<number, UserRating> = {};
    for (const row of rows) {
      const uid = Number(row.reviewedUserId);
      ratingsMap[uid] = {
        avg: Number(parseFloat(row.avg).toFixed(2)),
        count: Number(row.count)
      };
    }

    this.logger.log(`Calculated ratings for ${userIds.length} users`);
    return ratingsMap;
  }

  async getUserRating(userId: number): Promise<UserRating> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.reviewId)', 'count')
      .where('review.reviewedUserId = :userId', { userId })
      .getRawOne<{ avg: string; count: string }>();

    if (!result) {
      return { avg: 0, count: 0 };
    }

    const rating = {
      avg: Number(parseFloat(result.avg).toFixed(2)),
      count: Number(result.count)
    };

    this.logger.log(`Retrieved rating for user ${userId}: ${rating.avg} (${rating.count} reviews)`);
    return rating;
  }

  async updateUserRating(userId: number): Promise<void> {
    const rating = await this.getUserRating(userId);

    // This would typically update a user's rating field in their profile
    // For now, we'll calculate it on-demand
    this.logger.log(`Rating update requested for user ${userId}: ${rating.avg}`);
  }
}
