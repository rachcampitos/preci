import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { StoreType } from './schemas/store.schema';
import { SuggestStoreDto } from './dto/suggest-store.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('nearby')
  @UseGuards(OptionalAuthGuard)
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('type') type?: StoreType,
  ) {
    return this.storesService.findNearby({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      radiusMeters: radius ? parseInt(radius) : 5000,
      type,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.storesService.findById(id);
  }

  @Post('suggest')
  @UseGuards(OptionalAuthGuard)
  async suggest(@Body() dto: SuggestStoreDto) {
    return this.storesService.suggestStore(dto);
  }
}
