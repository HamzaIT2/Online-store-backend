import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { Image } from '../images/entities/image.entity';
import { Review } from '../reviews/entities/review.entity';
import { VipPlan } from '../vip-plan/entities/vip-plan.entity';
import { RatingsService } from '../../ratings/ratings.service';
import { VipService } from '../../vip/vip.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Image, Review, VipPlan]),

    // إعداد Multer
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {

          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1000);
          cb(null, `${randomName}${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, RatingsService, VipService],
  exports: [ProductsService],
})
export class ProductsModule { }







// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ProductsService } from './products.service';
// import { ProductsController } from './products.controller';
// import { Product } from './entities/product.entity';

// @Module({
//   imports: [TypeOrmModule.forFeature([Product])],
//   controllers: [ProductsController],
//   providers: [ProductsService],
//   exports: [ProductsService],
// })
// export class ProductsModule {}