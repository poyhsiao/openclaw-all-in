import { Router, Request, Response } from 'express';
import { BaseController } from '@/controllers/BaseController';
import { asyncErrorWrapper } from '@/middleware';

class HealthController extends BaseController {
  async checkHealth(_req: Request, res: Response): Promise<void> {
    this.handleSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}

const healthController = new HealthController();
const router = Router();

router.get(
  '/health',
  asyncErrorWrapper((req, res) => healthController.checkHealth(req, res))
);

export default router;
