import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ShoppingList,
  ShoppingListDocument,
} from './schemas/shopping-list.schema';
import { PricesService } from '../prices/prices.service';
import { ProductsService } from '../products/products.service';

export interface StoreTotalEntry {
  storeId: string;
  storeName: string;
  storeType: string;
  storeChain?: string;
  total: number;
  itemCount: number;
  missingItems: string[];
}

@Injectable()
export class ShoppingListsService {
  constructor(
    @InjectModel(ShoppingList.name)
    private readonly shoppingListModel: Model<ShoppingListDocument>,
    private readonly pricesService: PricesService,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: string, name: string): Promise<ShoppingListDocument> {
    return this.shoppingListModel.create({
      userId: new Types.ObjectId(userId),
      name: name.trim(),
      items: [],
      isActive: true,
    });
  }

  async findByUser(userId: string): Promise<ShoppingListDocument[]> {
    return this.shoppingListModel
      .find({ userId: new Types.ObjectId(userId), isActive: true })
      .populate('items.productId', 'name brand imageUrl unit')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(
    listId: string,
    userId: string,
  ): Promise<ShoppingListDocument> {
    const list = await this.shoppingListModel
      .findOne({
        _id: listId,
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .populate('items.productId', 'name brand imageUrl unit averagePrice');

    if (!list) {
      throw new NotFoundException('Lista de compras no encontrada');
    }

    return list;
  }

  async addItem(
    listId: string,
    userId: string,
    productId: string,
    quantity: number = 1,
  ): Promise<ShoppingListDocument> {
    const list = await this.shoppingListModel.findOne({
      _id: listId,
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!list) {
      throw new NotFoundException('Lista de compras no encontrada');
    }

    // Verify product exists
    await this.productsService.findById(productId);

    const productObjectId = new Types.ObjectId(productId);
    const existingIndex = list.items.findIndex((item) =>
      item.productId.equals(productObjectId),
    );

    if (existingIndex !== -1) {
      throw new BadRequestException('El producto ya está en la lista');
    }

    list.items.push({
      productId: productObjectId,
      quantity,
      isChecked: false,
    } as any);

    return list.save();
  }

  async updateItemQuantity(
    listId: string,
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<ShoppingListDocument> {
    const list = await this.shoppingListModel.findOne({
      _id: listId,
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!list) {
      throw new NotFoundException('Lista de compras no encontrada');
    }

    const productObjectId = new Types.ObjectId(productId);
    const item = list.items.find((i) => i.productId.equals(productObjectId));

    if (!item) {
      throw new NotFoundException('Producto no encontrado en la lista');
    }

    item.quantity = quantity;
    return list.save();
  }

  async removeItem(
    listId: string,
    userId: string,
    productId: string,
  ): Promise<ShoppingListDocument> {
    const list = await this.shoppingListModel.findOne({
      _id: listId,
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!list) {
      throw new NotFoundException('Lista de compras no encontrada');
    }

    const productObjectId = new Types.ObjectId(productId);
    const originalLength = list.items.length;
    list.items = list.items.filter(
      (item) => !item.productId.equals(productObjectId),
    ) as typeof list.items;

    if (list.items.length === originalLength) {
      throw new NotFoundException('Producto no encontrado en la lista');
    }

    return list.save();
  }

  async toggleItemChecked(
    listId: string,
    userId: string,
    productId: string,
  ): Promise<ShoppingListDocument> {
    const list = await this.shoppingListModel.findOne({
      _id: listId,
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!list) {
      throw new NotFoundException('Lista de compras no encontrada');
    }

    const productObjectId = new Types.ObjectId(productId);
    const item = list.items.find((i) => i.productId.equals(productObjectId));

    if (!item) {
      throw new NotFoundException('Producto no encontrado en la lista');
    }

    item.isChecked = !item.isChecked;
    return list.save();
  }

  async delete(
    listId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const list = await this.shoppingListModel.findOne({
      _id: listId,
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!list) {
      throw new NotFoundException('Lista de compras no encontrada');
    }

    list.isActive = false;
    await list.save();

    return { message: 'Lista eliminada correctamente' };
  }

  async getStoreTotals(
    listId: string,
    userId: string,
  ): Promise<StoreTotalEntry[]> {
    const list = await this.shoppingListModel.findOne({
      _id: listId,
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!list) {
      throw new NotFoundException('Lista de compras no encontrada');
    }

    if (list.items.length === 0) {
      return [];
    }

    // Fetch prices for all products in parallel
    const priceResults = await Promise.all(
      list.items.map(async (item) => {
        const productId = item.productId.toString();
        const prices = await this.pricesService.getPricesForProduct(productId);
        return { productId, quantity: item.quantity, prices };
      }),
    );

    // Build a map: storeId -> { meta, items: { productId, price }[] }
    const storeMap = new Map<
      string,
      {
        storeName: string;
        storeType: string;
        storeChain?: string;
        items: { productId: string; price: number; quantity: number }[];
      }
    >();

    // Track which products appear in each store (cheapest price per product per store)
    for (const { productId, quantity, prices } of priceResults) {
      // Group prices by store, keeping only the lowest price per store
      const cheapestByStore = new Map<string, (typeof prices)[0]>();
      for (const entry of prices) {
        const existing = cheapestByStore.get(entry.storeId);
        if (!existing || entry.price < existing.price) {
          cheapestByStore.set(entry.storeId, entry);
        }
      }

      for (const [storeId, entry] of cheapestByStore.entries()) {
        if (!storeMap.has(storeId)) {
          storeMap.set(storeId, {
            storeName: entry.storeName,
            storeType: entry.storeType,
            storeChain: undefined,
            items: [],
          });
        }
        storeMap.get(storeId)!.items.push({ productId, price: entry.price, quantity });
      }
    }

    // Build the result array
    const allProductIds = list.items.map((item) => item.productId.toString());

    const results: StoreTotalEntry[] = [];

    for (const [storeId, storeData] of storeMap.entries()) {
      const coveredProductIds = new Set(
        storeData.items.map((i) => i.productId),
      );

      const missingItems = allProductIds.filter(
        (pid) => !coveredProductIds.has(pid),
      );

      const total = storeData.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );

      results.push({
        storeId,
        storeName: storeData.storeName,
        storeType: storeData.storeType,
        storeChain: storeData.storeChain,
        total: Math.round(total * 100) / 100,
        itemCount: storeData.items.length,
        missingItems,
      });
    }

    // Sort by total ascending (cheapest store first)
    return results.sort((a, b) => a.total - b.total);
  }
}
