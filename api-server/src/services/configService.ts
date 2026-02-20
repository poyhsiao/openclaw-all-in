import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

const SALT_ROUNDS = 12;

/**
 * Configuration Service
 * Handles CRUD operations for models, API keys, and environment variables
 */
export class ConfigService {
  // ==================== Model Operations ====================

  /**
   * List all models
   */
  async listModels() {
    return prisma.model.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get model by ID
   */
  async getModelById(id: string) {
    return prisma.model.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new model
   */
  async createModel(data: {
    name: string;
    provider: string;
    modelId: string;
    description?: string;
    enabled?: boolean;
  }) {
    return prisma.model.create({
      data: {
        name: data.name,
        provider: data.provider,
        modelId: data.modelId,
        description: data.description,
        enabled: data.enabled ?? true,
      },
    });
  }

  /**
   * Update a model
   */
  async updateModel(
    id: string,
    data: {
      name?: string;
      provider?: string;
      modelId?: string;
      description?: string;
      enabled?: boolean;
    }
  ) {
    return prisma.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a model
   */
  async deleteModel(id: string) {
    return prisma.model.delete({
      where: { id },
    });
  }

  // ==================== API Key Operations ====================

  /**
   * List all API keys (masked)
   */
  async listApiKeys() {
    const keys = await prisma.apiKey.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((key) => ({
      ...key,
      keyHash: this.maskApiKey(key.keyHash),
    }));
  }

  /**
   * Get API key by ID (masked)
   */
  async getApiKeyById(id: string) {
    const key = await prisma.apiKey.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!key) {
      return null;
    }

    return {
      ...key,
      keyHash: this.maskApiKey(key.keyHash),
    };
  }

  /**
   * Create a new API key
   */
  async createApiKey(data: {
    userId: string;
    name: string;
    expiresAt?: Date;
  }) {
    const apiKey = this.generateApiKey();
    const keyHash = await bcrypt.hash(apiKey, SALT_ROUNDS);

    const createdKey = await prisma.apiKey.create({
      data: {
        userId: data.userId,
        name: data.name,
        keyHash,
        expiresAt: data.expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return {
      ...createdKey,
      keyHash: this.maskApiKey(createdKey.keyHash),
      plainKey: apiKey,
    };
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(id: string) {
    return prisma.apiKey.delete({
      where: { id },
    });
  }

  /**
   * Verify an API key
   */
  async verifyApiKey(apiKey: string): Promise<{ userId: string } | null> {
    const keys = await prisma.apiKey.findMany();

    for (const key of keys) {
      const isValid = await bcrypt.compare(apiKey, key.keyHash);
      if (isValid) {
        if (key.expiresAt && key.expiresAt < new Date()) {
          return null;
        }

        await prisma.apiKey.update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() },
        });

        return { userId: key.userId };
      }
    }

    return null;
  }

  // ==================== Environment Variable Operations ====================

  /**
   * List all environment variables
   */
  async listEnvVars() {
    const envVars = await prisma.envVar.findMany({
      orderBy: { key: 'asc' },
    });

    return envVars.map((envVar) => ({
      ...envVar,
      value: envVar.isSecret ? this.maskSecret(envVar.value) : envVar.value,
    }));
  }

  /**
   * Get environment variable by ID
   */
  async getEnvVarById(id: string) {
    const envVar = await prisma.envVar.findUnique({
      where: { id },
    });

    if (!envVar) {
      return null;
    }

    return {
      ...envVar,
      value: envVar.isSecret ? this.maskSecret(envVar.value) : envVar.value,
    };
  }

  /**
   * Create a new environment variable
   */
  async createEnvVar(data: {
    key: string;
    value: string;
    isSecret?: boolean;
  }) {
    return prisma.envVar.create({
      data: {
        key: data.key,
        value: data.value,
        isSecret: data.isSecret ?? true,
      },
    });
  }

  /**
   * Update an environment variable
   */
  async updateEnvVar(
    id: string,
    data: {
      key?: string;
      value?: string;
      isSecret?: boolean;
    }
  ) {
    return prisma.envVar.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an environment variable
   */
  async deleteEnvVar(id: string) {
    return prisma.envVar.delete({
      where: { id },
    });
  }

  // ==================== Utility Methods ====================

  /**
   * Generate a random API key
   */
  private generateApiKey(): string {
    const prefix = 'ocl_';
    const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `${prefix}${randomBytes}`;
  }

  /**
   * Mask API key for display
   */
  private maskApiKey(_keyHash: string): string {
    return '••••••••••••••••••••••••••••••••';
  }

  /**
   * Mask secret value for display
   */
  private maskSecret(value: string): string {
    if (value.length <= 8) {
      return '••••••••';
    }
    return `${value.substring(0, 4)}${'•'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
  }
}

export const configService = new ConfigService();
