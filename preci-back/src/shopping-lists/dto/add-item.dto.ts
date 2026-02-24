import { IsMongoId, IsOptional, IsInt, Min, Max } from 'class-validator';

export class AddItemDto {
  @IsMongoId({ message: 'El ID del producto no es válido' })
  productId: string;

  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  @Max(99, { message: 'La cantidad máxima es 99' })
  quantity?: number;
}
