import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';

// Import all feature modules
import { RatingsModule } from './ratings/ratings.module';
import { VipModule } from './vip/vip.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProvincesModule } from './modules/provinces/provinces.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ChatsModule } from './modules/chats/chats.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ImagesModule } from './modules/images/images.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MailerModule } from '@nestjs-modules/mailer';
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
      //envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,

    }),

    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: process.env.SMTP_FROM || '"No Reply" <noreply@iraq-marketplace.com>',
      },
    }),

    // Feature Modules
    RatingsModule,
    VipModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    ProvincesModule,
    ConversationsModule,
    MessagesModule,
    TransactionsModule,
    ChatsModule,
    ReviewsModule,
    FavoritesModule,
    ImagesModule,
    AuthModule,
    OrdersModule,
  ],

})
export class AppModule { }