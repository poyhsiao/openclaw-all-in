import { Router, Response } from 'express';
import { BaseController } from '@/controllers/BaseController';
import { asyncErrorWrapper } from '@/middleware';
import { authenticate, requireRole } from '@/middleware/auth';
import { UserService } from '@/services/userService';
import { AuditService } from '@/services/auditService';
import { UserRepository } from '@/repositories/UserRepository';
import { AuditRepository } from '@/repositories/AuditRepository';
import { UserRole, AuthenticatedRequest } from '@/types';

class UserController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly auditService: AuditService
  ) {
    super();
  }

  async listUsers(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const page = parseInt(_req.query.page as string) || 1;
    const limit = parseInt(_req.query.limit as string) || 10;

    const result = await this.userService.listUsers(page, limit);

    this.handleSuccess(res, result);
  }

  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email, password, name, role } = req.body;

    this.userService.validateUserData({ email, name, role });
    this.userService.validatePassword(password);

    const user = await this.userService.createUser({
      email,
      password,
      name,
      role,
    });

    await this.auditService.logAction({
      userId: req.user?.userId,
      action: 'USER_CREATED',
      details: { targetUserId: user.id, email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    this.handleSuccess(res, { user }, 201);
  }

  async getUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;

    const user = await this.userService.getById(userId);

    if (!user) {
      this.handleNotFound(res, 'User not found');
      return;
    }

    this.handleSuccess(res, { user });
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;
    const { name, email, role } = req.body;

    this.userService.validateUserData({ email, name, role });

    const user = await this.userService.updateUser(userId, {
      name,
      email,
      role,
    });

    await this.auditService.logAction({
      userId: req.user?.userId,
      action: 'USER_UPDATED',
      details: { targetUserId: userId, changes: { name, email, role } },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    this.handleSuccess(res, { user });
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;

    // Prevent users from deleting their own account
    if (req.user?.userId === userId) {
      await this.auditService.logAction({
        userId: req.user?.userId,
        action: 'SELF_DELETION_ATTEMPT',
        details: { targetUserId: userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      this.handleValidationError(res, 'Cannot delete your own account');
      return;
    }

    await this.userService.deleteUser(userId);

    await this.auditService.logAction({
      userId: req.user?.userId,
      action: 'USER_DELETED',
      details: { targetUserId: userId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    this.handleSuccess(res, { message: 'User deleted successfully' });
  }

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      this.handleValidationError(res, 'Authentication required');
      return;
    }

    const user = await this.userService.getById(req.user.userId);

    if (!user) {
      this.handleNotFound(res, 'User not found');
      return;
    }

    this.handleSuccess(res, { user });
  }

  async updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      this.handleValidationError(res, 'Authentication required');
      return;
    }

    const { name, email } = req.body;

    this.userService.validateUserData({ email, name });

    const user = await this.userService.updateProfile(req.user.userId, {
      name,
      email,
    });

    await this.auditService.logAction({
      userId: req.user.userId,
      action: 'PROFILE_UPDATED',
      details: { changes: { name, email } },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    this.handleSuccess(res, { user });
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      this.handleValidationError(res, 'Authentication required');
      return;
    }

    const { currentPassword, newPassword } = req.body;

    this.userService.validatePassword(newPassword);

    const user = await this.userService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    await this.auditService.logAction({
      userId: req.user.userId,
      action: 'PASSWORD_CHANGED',
      details: { userId: req.user.userId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    this.handleSuccess(res, { user });
  }
}

const userRepository = new UserRepository();
const auditRepository = new AuditRepository();
const userService = new UserService(userRepository);
const auditService = new AuditService(auditRepository);
const userController = new UserController(userService, auditService);
const router = Router();

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => userController.listUsers(req, res))
);

router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => userController.createUser(req, res))
);

router.get(
  '/me',
  authenticate,
  asyncErrorWrapper((req, res) => userController.getMe(req, res))
);

router.put(
  '/me',
  authenticate,
  asyncErrorWrapper((req, res) => userController.updateMe(req, res))
);

router.get(
  '/:id',
  authenticate,
  asyncErrorWrapper((req, res) => userController.getUser(req, res))
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => userController.updateUser(req, res))
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => userController.deleteUser(req, res))
);

router.put(
  '/me/password',
  authenticate,
  asyncErrorWrapper((req, res) => userController.changePassword(req, res))
);

export default router;
