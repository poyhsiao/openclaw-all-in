import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '@/config/unifiedConfig';
import { JWTPayload } from '@/types';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: { id: string; email: string; role: string }): string {
  const payload = {
    type: 'access' as const,
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
  };

  return jwt.sign(payload, config.auth.jwtSecret);
}

export function generateRefreshToken(userId: string): string {
  const payload = {
    type: 'refresh' as const,
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
  };

  return jwt.sign(payload, config.auth.jwtSecret);
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload & { type?: string };

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as { userId: string; type?: string };

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}
