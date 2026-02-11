import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  createUser(supabaseId: string, email: string) {
    return this.prisma.user.create({
      data: {
        supabaseId,
        email,
      },
    });
  }

  findBySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({
      where: { supabaseId },
    });
  }
}
