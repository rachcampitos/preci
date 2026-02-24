import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateListDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(50, { message: 'El nombre no puede superar 50 caracteres' })
  name: string;
}
