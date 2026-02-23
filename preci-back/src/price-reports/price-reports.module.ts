import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PriceReport,
  PriceReportSchema,
} from './schemas/price-report.schema';
import { PriceReportsService } from './price-reports.service';
import { PriceReportsController } from './price-reports.controller';
import { StoresModule } from '../stores/stores.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceReport.name, schema: PriceReportSchema },
    ]),
    StoresModule,
    GamificationModule,
  ],
  controllers: [PriceReportsController],
  providers: [PriceReportsService],
  exports: [PriceReportsService],
})
export class PriceReportsModule {}
