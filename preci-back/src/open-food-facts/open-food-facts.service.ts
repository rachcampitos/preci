import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class OpenFoodFactsService {
  private readonly logger = new Logger(OpenFoodFactsService.name);
  private readonly BASE_URL = 'https://world.openfoodfacts.org/api/v2';

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async fetchAndCacheProduct(
    barcode: string,
  ): Promise<ProductDocument | null> {
    try {
      const { data } = await this.httpService.axiosRef.get(
        `${this.BASE_URL}/product/${barcode}`,
        {
          params: {
            fields:
              'product_name,product_name_es,product_name_en,brands,categories,image_url,quantity,nutriments',
          },
          timeout: 5000,
        },
      );

      if (data.status !== 1 || !data.product) return null;

      const p = data.product;
      const name =
        p.product_name_es ||
        p.product_name ||
        p.product_name_en ||
        'Producto sin nombre';

      return this.productModel.create({
        barcode,
        name,
        brand: p.brands?.split(',')[0]?.trim(),
        imageUrl: p.image_url,
        openFoodFactsData: p,
        isVerified: false,
      });
    } catch (error) {
      this.logger.warn(
        `Open Food Facts fetch failed for ${barcode}: ${error.message}`,
      );
      return null;
    }
  }
}
