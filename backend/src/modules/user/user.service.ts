import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  syncUser(
    supabaseId: string,
    email: string,
    firstName?: string,
    lastName?: string,
  ) {
    return this.userRepo.upsertBySupabaseId(
      supabaseId,
      email,
      firstName,
      lastName,
    );
  }

  getUserProfile(supabaseId: string) {
    return this.userRepo.findBySupabaseId(supabaseId);
  }
}
