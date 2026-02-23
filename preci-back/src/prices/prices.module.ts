import { Module } from '@nestjs/common';
import { PriceReportsModule } from '../price-reports/price-reports.module';
import { ScrapingModule } from '../scraping/scraping.module';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';

@Module({
  imports: [PriceReportsModule, ScrapingModule],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
