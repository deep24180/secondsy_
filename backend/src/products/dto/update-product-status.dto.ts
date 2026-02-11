import { IsIn } from 'class-validator';

export class UpdateProductStatusDto {
  @IsIn(['Active', 'Sold', 'Expired'])
  status: 'Active' | 'Sold' | 'Expired';
}
