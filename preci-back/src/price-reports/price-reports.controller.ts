import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PriceReportsService } from './price-reports.service';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('price-reports')
export class PriceReportsController {
  constructor(private readonly priceReportsService: PriceReportsService) {}

  @Post()
  @UseGuards(OptionalAuthGuard)
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.priceReportsService.create({
      ...body,
      userId: user?._id?.toString(),
    });
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.priceReportsService.confirmReport(id, user._id.toString());
  }

  @Get('product/:productId')
  async getByProduct(@Param('productId') productId: string) {
    return this.priceReportsService.getRecentByProduct(productId);
  }
}
