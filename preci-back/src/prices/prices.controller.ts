import { Controller, Get, Param } from '@nestjs/common';
import { PricesService } from './prices.service';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get('product/:productId')
  async getPricesForProduct(@Param('productId') productId: string) {
    return this.pricesService.getPricesForProduct(productId);
  }
}
