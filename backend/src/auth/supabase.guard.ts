import jwt from 'jsonwebtoken';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    request.user = await this.resolveVerifiedUser(token);

    return true;
  }

  private async resolveVerifiedUser(token: string) {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    const jwtPublicKey = process.env.SUPABASE_JWT_PUBLIC_KEY?.replace(
      /\\n/g,
      '\n',
    );
    const signingKey = jwtSecret || jwtPublicKey;

    if (signingKey) {
      return this.verifyWithJwt(token, signingKey, Boolean(jwtSecret));
    }

    return this.verifyWithSupabaseAuthApi(token);
  }

  private verifyWithJwt(
    token: string,
    signingKey: string,
    isHmacSecret: boolean,
  ) {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

    const verifyOptions: jwt.VerifyOptions = {
      algorithms: isHmacSecret ? ['HS256'] : ['RS256'],
    };

    if (supabaseUrl) {
      verifyOptions.issuer = `${supabaseUrl}/auth/v1`;
    }

    let verified: string | jwt.JwtPayload;
    try {
      verified = jwt.verify(token, signingKey, verifyOptions);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (typeof verified !== 'object' || typeof verified.sub !== 'string') {
      throw new UnauthorizedException('Invalid token payload');
    }

    return verified;
  }

  private async verifyWithSupabaseAuthApi(token: string) {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new UnauthorizedException(
        'Server auth is not configured for token verification',
      );
    }

    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new UnauthorizedException('Auth verification service unavailable');
    }

    if (!response.ok) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = (await response.json()) as {
      id?: string;
      email?: string;
      [key: string]: unknown;
    };

    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      ...user,
      sub: user.id,
    };
  }
}
