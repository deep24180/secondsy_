import { Request } from 'express';

export type AuthenticatedUser = {
  sub: string;
  email?: string;
  [key: string]: unknown;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
