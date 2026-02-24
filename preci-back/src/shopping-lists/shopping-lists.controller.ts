import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ShoppingListsService } from './shopping-lists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateListDto } from './dto/create-list.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemQuantityDto } from './dto/update-item-quantity.dto';

@Controller('shopping-lists')
@UseGuards(JwtAuthGuard)
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Post()
  async create(
    @Body() dto: CreateListDto,
    @CurrentUser() user: any,
  ) {
    return this.shoppingListsService.create(user._id.toString(), dto.name);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.shoppingListsService.findByUser(user._id.toString());
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.shoppingListsService.findById(id, user._id.toString());
  }

  @Get(':id/store-totals')
  async getStoreTotals(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.shoppingListsService.getStoreTotals(id, user._id.toString());
  }

  @Post(':id/items')
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddItemDto,
    @CurrentUser() user: any,
  ) {
    return this.shoppingListsService.addItem(
      id,
      user._id.toString(),
      dto.productId,
      dto.quantity,
    );
  }

  @Patch(':id/items/:productId')
  async updateItemQuantity(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateItemQuantityDto,
    @CurrentUser() user: any,
  ) {
    return this.shoppingListsService.updateItemQuantity(
      id,
      user._id.toString(),
      productId,
      dto.quantity,
    );
  }

  @Delete(':id/items/:productId')
  async removeItem(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @CurrentUser() user: any,
  ) {
    return this.shoppingListsService.removeItem(
      id,
      user._id.toString(),
      productId,
    );
  }

  @Patch(':id/items/:productId/toggle')
  async toggleItemChecked(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @CurrentUser() user: any,
  ) {
    return this.shoppingListsService.toggleItemChecked(
      id,
      user._id.toString(),
      productId,
    );
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.shoppingListsService.delete(id, user._id.toString());
  }
}
