import { Router } from 'express';
import { DashboardController } from '@/controllers/dashboardController';
import { asyncErrorWrapper } from '@/middleware';
import { authenticate } from '@/middleware/auth';

const dashboardController = new DashboardController();
const router = Router();

router.get(
  '/overview',
  authenticate,
  asyncErrorWrapper((req, res) => dashboardController.getOverview(req, res))
);

router.get(
  '/services',
  authenticate,
  asyncErrorWrapper((req, res) => dashboardController.getServicesSummary(req, res))
);

router.get(
  '/health',
  authenticate,
  asyncErrorWrapper((req, res) => dashboardController.getHealthCheck(req, res))
);

router.get(
  '/stats',
  authenticate,
  asyncErrorWrapper((req, res) => dashboardController.getResourceStats(req, res))
);

export default router;
