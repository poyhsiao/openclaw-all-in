import { Request } from 'express';

/**
 * User roles
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Authenticated request with user attached
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Login request body
 */
export interface LoginRequestBody {
  email: string;
  password: string;
}

/**
 * Register request body
 */
export interface RegisterRequestBody {
  email: string;
  password: string;
  name?: string;
}

/**
 * Refresh token request body
 */
export interface RefreshTokenRequestBody {
  refreshToken: string;
}

/**
 * Auth response with tokens
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * User update request body
 */
export interface UpdateUserRequestBody {
  name?: string;
  email?: string;
  role?: string;
}
