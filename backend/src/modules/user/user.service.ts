import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  syncUser(supabaseId: string, email: string) {
    return this.userRepo.upsertBySupabaseId(supabaseId, email);
  }
}
