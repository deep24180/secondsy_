import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertBySupabaseId(supabaseId: string, email: string) {
    return this.prisma.user.upsert({
      where: { supabaseId },
      update: { email },
      create: { supabaseId, email },
    });
  }
}
