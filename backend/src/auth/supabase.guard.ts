import jwt from 'jsonwebtoken';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');

    const decoded = jwt.decode(token);

    if (!decoded) {
      throw new UnauthorizedException('Invalid token');
    }

    // Attach user info to request
    request.user = decoded;

    return true;
  }
}
