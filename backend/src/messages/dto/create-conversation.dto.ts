import { IsString, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @MinLength(1)
  productId: string;

  @IsString()
  @MinLength(1)
  otherUserId: string;
}
