import { Controller, Post, Get, Param, Query } from '@nestjs/common';
import { ScrapingService } from './scraping.service';

@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  /**
   * Trigger full scraping of all VTEX stores
   * POST /scraping/run
   */
  @Post('run')
  async runFullScrape() {
    // Run async — don't block the response
    this.scrapingService.scrapeAllSupermarkets();
    return { message: 'Scraping iniciado en background' };
  }

  /**
   * Trigger scraping of a single store chain
   * POST /scraping/run/:chain
   */
  @Post('run/:chain')
  async runChainScrape(@Param('chain') chain: string) {
    const count = await this.scrapingService.scrapeChain(chain);
    return { chain, productsSaved: count };
  }

  /**
   * Get latest scraped prices for a product by barcode
   * GET /scraping/prices?barcode=123456
   */
  @Get('prices')
  async getPricesByBarcode(@Query('barcode') barcode: string) {
    return this.scrapingService.getPricesByBarcode(barcode);
  }
}
