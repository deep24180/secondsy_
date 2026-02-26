import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import type { AuthenticatedRequest } from '../../auth/auth-request.interface';
import { UserService } from './user.service';
import { SyncUserDto } from './dto/sync-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post('me')
  syncCurrentUser(@Req() req: AuthenticatedRequest, @Body() body: SyncUserDto) {
    const supabaseId = req.user?.sub;
    const email = req.user?.email;

    if (typeof supabaseId !== 'string' || !supabaseId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (typeof email !== 'string' || !email) {
      throw new UnauthorizedException('Email claim missing from token');
    }

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();

    return this.userService.syncUser(
      supabaseId,
      email,
      firstName || undefined,
      lastName || undefined,
    );
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  getCurrentUser(@Req() req: AuthenticatedRequest) {
    const supabaseId = req.user?.sub;

    if (typeof supabaseId !== 'string' || !supabaseId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.userService.getUserProfile(supabaseId);
  }
}
