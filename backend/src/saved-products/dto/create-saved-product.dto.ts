import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSavedProductDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}
