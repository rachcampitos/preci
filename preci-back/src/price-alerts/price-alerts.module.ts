import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PriceAlert, PriceAlertSchema } from './schemas/price-alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceAlert.name, schema: PriceAlertSchema },
    ]),
  ],
  // TODO: controllers, providers
})
export class PriceAlertsModule {}
