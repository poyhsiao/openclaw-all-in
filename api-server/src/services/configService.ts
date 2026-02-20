import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/utils/encryption';

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
  async listApiKeys(includeUserEmail = false) {
    const keys = await prisma.apiKey.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            ...(includeUserEmail && { email: true }),
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
      // Decrypt and then mask value if it's a secret
      value: envVar.isSecret
        ? this.maskSecret(decrypt(envVar.value))
        : envVar.value,
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
      // Decrypt and then mask value if it's a secret
      value: envVar.isSecret
        ? this.maskSecret(decrypt(envVar.value))
        : envVar.value,
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
    // Encrypt secret values before storing
    const isSecret = data.isSecret ?? true;
    const valueToStore = isSecret ? encrypt(data.value) : data.value;

    return prisma.envVar.create({
      data: {
        key: data.key,
        value: valueToStore,
        isSecret,
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
    // If updating value and isSecret not provided, derive from existing record
    const updateData: any = {};
    if (data.key !== undefined) updateData.key = data.key;

    if (data.value !== undefined) {
      // When isSecret is not provided, fetch existing record to determine encryption
      let shouldEncrypt = data.isSecret;

      if (data.isSecret === undefined) {
        const existingVar = await prisma.envVar.findUnique({
          where: { id },
          select: { isSecret: true },
        });
        shouldEncrypt = existingVar?.isSecret ?? true;
      }

      updateData.value = shouldEncrypt ? encrypt(data.value) : data.value;
    }

    // Only update isSecret when explicitly provided
    if (data.isSecret !== undefined) updateData.isSecret = data.isSecret;

    return prisma.envVar.update({
      where: { id },
      data: updateData,
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
    const visibleTotal = 4;
    const prefix = Math.ceil(visibleTotal / 2);
    const suffix = Math.floor(visibleTotal / 2);
    return `${value.substring(0, prefix)}${'•'.repeat(value.length - (prefix + suffix))}${value.substring(value.length - suffix)}`;
  }
}

export const configService = new ConfigService();
