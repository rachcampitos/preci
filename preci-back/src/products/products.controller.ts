import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('barcode/:barcode')
  @UseGuards(OptionalAuthGuard)
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Get('search')
  @UseGuards(OptionalAuthGuard)
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.search(query, limit ? parseInt(limit) : 10);
  }

  @Get('basket')
  async getBasketProducts() {
    return this.productsService.getBasketProducts();
  }

  @Get('popular')
  async getPopular(
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    return this.productsService.getPopular(
      limit ? parseInt(limit) : 30,
      category,
    );
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }
}
