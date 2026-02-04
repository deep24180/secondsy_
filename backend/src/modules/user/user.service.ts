import { Injectable, ConflictException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.userRepo.findBySupabaseId(
      dto.supabaseId,
    );

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    return this.userRepo.createUser(dto.supabaseId, dto.email);
  }
}
