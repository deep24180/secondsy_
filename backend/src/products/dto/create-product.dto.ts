import {
  IsString,
  IsBoolean,
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateProductDto {
  @IsString() title: string;
  @IsString() category: string;
  @IsString() subcategory: string;
  @IsNumber() price: number;
  @IsString() condition: string;
  @IsString() description: string;

  @IsArray()
  @IsOptional()
  images: string[];

  @IsString() email: string;
  @IsString() phone: string;
  @IsString() location: string;

  @IsBoolean() deliveryPickup: boolean;
  @IsBoolean() deliveryShipping: boolean;
}
