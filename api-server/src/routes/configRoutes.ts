import { Router, Response } from 'express';
import { BaseController } from '@/controllers/BaseController';
import { asyncErrorWrapper } from '@/middleware';
import { authenticate, requireRole } from '@/middleware/auth';
import { configService } from '@/services/configService';
import { AuthenticatedRequest, UserRole } from '@/types';
import { validateModelInput, validateEnvVarInput } from '@/utils/validation';

class ConfigController extends BaseController {
  async listModels(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const models = await configService.listModels();
    this.handleSuccess(res, { models });
  }

  async getModel(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const modelId = Array.isArray(id) ? id[0] : id;

    const model = await configService.getModelById(modelId);

    if (!model) {
      this.handleNotFound(res, 'Model not found');
      return;
    }

    this.handleSuccess(res, { model });
  }

  async createModel(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Validate required fields
    const validation = validateModelInput(req.body, false);
    if (!validation.valid) {
      this.handleValidationError(res, validation.errors.join(', '));
      return;
    }

    const { name, provider, modelId, description, enabled } = req.body;

    const model = await configService.createModel({
      name,
      provider,
      modelId,
      description,
      enabled,
    });

    this.handleSuccess(res, { model }, 201);
  }

  async updateModel(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const modelId = Array.isArray(id) ? id[0] : id;

    // Validate update input
    const validation = validateModelInput(req.body, true);
    if (!validation.valid) {
      this.handleValidationError(res, validation.errors.join(', '));
      return;
    }

    const { name, provider, modelId: newModelId, description, enabled } = req.body;

    // Build update payload only from provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (provider !== undefined) updateData.provider = provider;
    if (newModelId !== undefined) updateData.modelId = newModelId;
    if (description !== undefined) updateData.description = description;
    if (enabled !== undefined) updateData.enabled = enabled;

    const existingModel = await configService.getModelById(modelId);

    if (!existingModel) {
      this.handleNotFound(res, 'Model not found');
      return;
    }

    const model = await configService.updateModel(modelId, updateData);

    this.handleSuccess(res, { model });
  }

  async deleteModel(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const modelId = Array.isArray(id) ? id[0] : id;

    const existingModel = await configService.getModelById(modelId);

    if (!existingModel) {
      this.handleNotFound(res, 'Model not found');
      return;
    }

    await configService.deleteModel(modelId);

    this.handleSuccess(res, { message: 'Model deleted successfully' });
  }

  async listApiKeys(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const apiKeys = await configService.listApiKeys();
    this.handleSuccess(res, { apiKeys });
  }

  async getApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const apiKeyId = Array.isArray(id) ? id[0] : id;

    const apiKey = await configService.getApiKeyById(apiKeyId);

    if (!apiKey) {
      this.handleNotFound(res, 'API key not found');
      return;
    }

    this.handleSuccess(res, { apiKey });
  }

  async createApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId, name, expiresAt } = req.body;

    // Validate expiresAt
    let parsedExpiresAt: Date | undefined;
    if (expiresAt !== undefined) {
      const timestamp = Date.parse(expiresAt);
      if (isNaN(timestamp)) {
        this.handleValidationError(res, 'Invalid expiresAt date format');
        return;
      }
      parsedExpiresAt = new Date(expiresAt);
    }

    // Use authenticated user's ID if userId is not provided
    // If userId is provided by request, ensure it's an admin or same user
    let targetUserId: string;
    if (userId !== undefined) {
      if (req.user?.role !== UserRole.ADMIN && req.user?.userId !== userId) {
        this.handleValidationError(res, 'Cannot create API key for another user');
        return;
      }
      targetUserId = userId;
    } else {
      if (!req.user?.userId) {
        this.handleError(new Error('User not authenticated'), res, 'createApiKey');
        return;
      }
      targetUserId = req.user.userId;
    }

    const apiKey = await configService.createApiKey({
      userId: targetUserId,
      name,
      expiresAt: parsedExpiresAt,
    });

    this.handleSuccess(res, { apiKey }, 201);
  }

  async deleteApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const apiKeyId = Array.isArray(id) ? id[0] : id;

    const existingApiKey = await configService.getApiKeyById(apiKeyId);

    if (!existingApiKey) {
      this.handleNotFound(res, 'API key not found');
      return;
    }

    await configService.deleteApiKey(apiKeyId);

    this.handleSuccess(res, { message: 'API key deleted successfully' });
  }

  async listEnvVars(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const envVars = await configService.listEnvVars();
    this.handleSuccess(res, { envVars });
  }

  async getEnvVar(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const envVarId = Array.isArray(id) ? id[0] : id;

    const envVar = await configService.getEnvVarById(envVarId);

    if (!envVar) {
      this.handleNotFound(res, 'Environment variable not found');
      return;
    }

    this.handleSuccess(res, { envVar });
  }

  async createEnvVar(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Validate input
    const validation = validateEnvVarInput(req.body);
    if (!validation.valid) {
      this.handleValidationError(res, validation.errors.join(', '));
      return;
    }

    const { key, value, isSecret } = req.body;

    // Normalize inputs
    const normalizedKey = key.trim();
    const normalizedValue = value;
    const normalizedIsSecret = isSecret !== undefined ? isSecret : false;

    const envVar = await configService.createEnvVar({
      key: normalizedKey,
      value: normalizedValue,
      isSecret: normalizedIsSecret,
    });

    this.handleSuccess(res, { envVar }, 201);
  }

  async updateEnvVar(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const envVarId = Array.isArray(id) ? id[0] : id;
    const { key, value, isSecret } = req.body;

    const existingEnvVar = await configService.getEnvVarById(envVarId);

    if (!existingEnvVar) {
      this.handleNotFound(res, 'Environment variable not found');
      return;
    }

    const envVar = await configService.updateEnvVar(envVarId, {
      key,
      value,
      isSecret,
    });

    this.handleSuccess(res, { envVar });
  }

  async deleteEnvVar(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const envVarId = Array.isArray(id) ? id[0] : id;

    const existingEnvVar = await configService.getEnvVarById(envVarId);

    if (!existingEnvVar) {
      this.handleNotFound(res, 'Environment variable not found');
      return;
    }

    await configService.deleteEnvVar(envVarId);

    this.handleSuccess(res, { message: 'Environment variable deleted successfully' });
  }
}

const configController = new ConfigController();
const router = Router();

router.get(
  '/models',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.listModels(req, res))
);

router.get(
  '/models/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.getModel(req, res))
);

router.post(
  '/models',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.createModel(req, res))
);

router.put(
  '/models/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.updateModel(req, res))
);

router.delete(
  '/models/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.deleteModel(req, res))
);

router.get(
  '/keys',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.listApiKeys(req, res))
);

router.get(
  '/keys/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.getApiKey(req, res))
);

router.post(
  '/keys',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.createApiKey(req, res))
);

router.delete(
  '/keys/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.deleteApiKey(req, res))
);

router.get(
  '/env',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.listEnvVars(req, res))
);

router.get(
  '/env/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.getEnvVar(req, res))
);

router.post(
  '/env',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.createEnvVar(req, res))
);

router.put(
  '/env/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.updateEnvVar(req, res))
);

router.delete(
  '/env/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => configController.deleteEnvVar(req, res))
);

export default router;
