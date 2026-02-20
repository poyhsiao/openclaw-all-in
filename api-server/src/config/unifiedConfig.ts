import dotenv from 'dotenv';

dotenv.config();

/**
 * Unified configuration object
 * All configuration should be accessed through this object
 * Never use process.env directly in application code
 */

// Validate production environment
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Require DATABASE_URL in production
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required in production. Set it to a valid database connection string.');
  }

  // Require JWT_SECRET in production
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required in production. Generate a cryptographically strong secret using: openssl rand -base64 48');
  }

  // Require ENC_KEY in production for secret encryption
  if (!process.env.ENC_KEY) {
    throw new Error('ENC_KEY environment variable is required in production for secret encryption. Generate using: openssl rand -base64 32');
  }
}

export const config = {
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },

  database: {
    url: process.env.DATABASE_URL || (isProduction ? '' : 'file:./dev.db'),
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || (isProduction ? '' : 'your-secret-key-change-in-production'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
  },

  docker: {
    socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

export type Config = typeof config;
