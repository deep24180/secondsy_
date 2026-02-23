import { Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/auth/supabase.guard';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post('me')
  syncCurrentUser(@Req() req) {
    const supabaseId = req.user?.sub;
    const email = req.user?.email;

    if (typeof supabaseId !== 'string' || !supabaseId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (typeof email !== 'string' || !email) {
      throw new UnauthorizedException('Email claim missing from token');
    }

    return this.userService.syncUser(supabaseId, email);
  }
}
