import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { OpenFoodFactsService } from '../open-food-facts/open-food-facts.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly offService: OpenFoodFactsService,
  ) {}

  async findByBarcode(barcode: string) {
    const product = await this.productModel.findOne({
      barcode,
      isActive: true,
    });

    if (product) return product;

    return this.offService.fetchAndCacheProduct(barcode);
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  async search(query: string, limit = 20): Promise<ProductDocument[]> {
    return this.productModel
      .find(
        { $text: { $search: query }, isActive: true },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();
  }

  async getBasketProducts(): Promise<ProductDocument[]> {
    return this.productModel
      .find({ isMvpBasket: true, isActive: true })
      .sort({ category: 1, name: 1 })
      .lean();
  }

  async getPopular(limit = 30, category?: string): Promise<ProductDocument[]> {
    const query: any = {
      isActive: true,
      averagePrice: { $gt: 0 },
      imageUrl: { $exists: true, $ne: '' },
    };
    if (category) {
      query.category = category;
    }
    return this.productModel
      .find(query)
      .sort({ totalPriceReports: -1, averagePrice: 1 })
      .limit(limit)
      .lean();
  }
}
