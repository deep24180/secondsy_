import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import type { AuthenticatedUser } from './auth-request.interface';

type JwtVerifyOptions = {
  algorithms: string[];
  issuer?: string;
};

type JwtVerifyFn = (
  token: string,
  signingKey: string,
  options: JwtVerifyOptions,
) => unknown;

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rawRequest = context.switchToHttp().getRequest<unknown>();
    const authHeader = this.getAuthorizationHeader(rawRequest);

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

    const requestWithUser = rawRequest as { user?: AuthenticatedUser };
    requestWithUser.user = await this.resolveVerifiedUser(token);

    return true;
  }

  private async resolveVerifiedUser(token: string): Promise<AuthenticatedUser> {
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
  ): AuthenticatedUser {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

    const verifyOptions: JwtVerifyOptions = {
      algorithms: isHmacSecret ? ['HS256'] : ['RS256'],
    };

    if (supabaseUrl) {
      verifyOptions.issuer = `${supabaseUrl}/auth/v1`;
    }

    const jwtVerify = (jwt as unknown as { verify: JwtVerifyFn }).verify;
    let verified: unknown;
    try {
      verified = jwtVerify(token, signingKey, verifyOptions);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!this.isAuthenticatedUser(verified)) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return verified;
  }

  private async verifyWithSupabaseAuthApi(
    token: string,
  ): Promise<AuthenticatedUser> {
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

    const rawUser = (await response.json()) as unknown;
    if (!this.isRecord(rawUser) || typeof rawUser.id !== 'string') {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      ...rawUser,
      sub: rawUser.id,
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getAuthorizationHeader(request: unknown): string | null {
    if (!this.isRecord(request)) {
      return null;
    }

    const headers = request.headers;
    if (!this.isRecord(headers)) {
      return null;
    }

    const authorization = headers.authorization;
    if (typeof authorization === 'string') {
      return authorization;
    }

    if (Array.isArray(authorization) && typeof authorization[0] === 'string') {
      return authorization[0];
    }

    return null;
  }

  private isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
    return this.isRecord(value) && typeof value.sub === 'string';
  }
}
