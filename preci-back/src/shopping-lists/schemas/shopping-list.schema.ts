import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class ShoppingListItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ default: 1, min: 1 })
  quantity: number;

  @Prop({ default: false })
  isChecked: boolean;

  @Prop()
  lastKnownPrice: number;
}

const ShoppingListItemSchema =
  SchemaFactory.createForClass(ShoppingListItem);

@Schema({
  timestamps: true,
  collection: 'shopping_lists',
  toJSON: { virtuals: true, versionKey: false },
})
export class ShoppingList {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 'Mi lista' })
  name: string;

  @Prop({ type: [ShoppingListItemSchema], default: [] })
  items: ShoppingListItem[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  recommendedStoreId: string;

  @Prop()
  estimatedTotal: number;
}

export type ShoppingListDocument = HydratedDocument<ShoppingList>;
export const ShoppingListSchema =
  SchemaFactory.createForClass(ShoppingList);
