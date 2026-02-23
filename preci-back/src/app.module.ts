import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { StoresModule } from './stores/stores.module';
import { PriceReportsModule } from './price-reports/price-reports.module';
import { PricesModule } from './prices/prices.module';
import { ScrapingModule } from './scraping/scraping.module';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';
import { PriceAlertsModule } from './price-alerts/price-alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GamificationModule } from './gamification/gamification.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URL'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    ProductsModule,
    StoresModule,
    PriceReportsModule,
    PricesModule,
    ScrapingModule,
    ShoppingListsModule,
    PriceAlertsModule,
    NotificationsModule,
    GamificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
