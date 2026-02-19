import { Router, Response } from 'express';
import { BaseController } from '@/controllers/BaseController';
import { asyncErrorWrapper } from '@/middleware';
import { authenticate, requireRole } from '@/middleware/auth';
import { AuditService } from '@/services/auditService';
import { AuditRepository } from '@/repositories/AuditRepository';
import { UserRole, AuthenticatedRequest } from '@/types';

class AuditController extends BaseController {
  constructor(private readonly auditService: AuditService) {
    super();
  }

  async getAllAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.query.userId as string | undefined;
    const action = req.query.action as string | undefined;

    const result = await this.auditService.getAllAuditLogs({
      page,
      limit,
      userId,
      action,
    });

    this.handleSuccess(res, result);
  }

  async getUserAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;
    const targetUserId = Array.isArray(userId) ? userId[0] : userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await this.auditService.getUserAuditLogs(targetUserId, page, limit);

    this.handleSuccess(res, result);
  }
}

const auditRepository = new AuditRepository();
const auditService = new AuditService(auditRepository);
const auditController = new AuditController(auditService);
const router = Router();

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => auditController.getAllAuditLogs(req, res))
);

router.get(
  '/user/:userId',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncErrorWrapper((req, res) => auditController.getUserAuditLogs(req, res))
);

export default router;
