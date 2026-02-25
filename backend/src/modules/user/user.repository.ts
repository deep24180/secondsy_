import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertBySupabaseId(
    supabaseId: string,
    email: string,
    firstName?: string,
    lastName?: string,
  ) {
    const profileUpdate = {
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
    };

    return this.prisma.user.upsert({
      where: { supabaseId },
      update: {
        email,
        ...profileUpdate,
      },
      create: {
        supabaseId,
        email,
        ...profileUpdate,
      },
    });
  }

  findBySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({
      where: { supabaseId },
    });
  }
}
