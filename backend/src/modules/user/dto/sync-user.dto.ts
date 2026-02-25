import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SyncUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  lastName?: string;
}
