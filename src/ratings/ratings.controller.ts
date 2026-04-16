import { Controller, Get, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { UserRating } from './interfaces/user-rating.interface';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) { }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user rating statistics' })
  @ApiResponse({ status: 200, description: 'User rating retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserRating(@Param('userId', ParseIntPipe) userId: number): Promise<UserRating> {
    return this.ratingsService.getUserRating(userId);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get ratings for multiple users' })
  @ApiQuery({ name: 'userIds', required: true, description: 'Comma-separated user IDs', type: String })
  @ApiResponse({ status: 200, description: 'Ratings retrieved successfully' })
  async getMultipleUserRatings(@Query('userIds') userIds: string): Promise<Record<number, UserRating>> {
    const userIdArray = userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    return this.ratingsService.getRatingsByUserIds(userIdArray);
  }
}
