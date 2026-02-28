import { IsISO8601, IsOptional } from 'class-validator';

export class MarkConversationReadDto {
  @IsOptional()
  @IsISO8601()
  seenAt?: string;
}
