import { Router } from 'express';
import { ServiceController } from '@/controllers/serviceController';
import { asyncErrorWrapper } from '@/middleware';
import { authenticate } from '@/middleware/auth';

const serviceController = new ServiceController();
const router = Router();

router.get(
  '/',
  authenticate,
  asyncErrorWrapper((req, res) => serviceController.listServices(req, res))
);

router.get(
  '/:name',
  authenticate,
  asyncErrorWrapper((req, res) => serviceController.getService(req, res))
);

router.post(
  '/:name/start',
  authenticate,
  asyncErrorWrapper((req, res) => serviceController.startService(req, res))
);

router.post(
  '/:name/stop',
  authenticate,
  asyncErrorWrapper((req, res) => serviceController.stopService(req, res))
);

router.post(
  '/:name/restart',
  authenticate,
  asyncErrorWrapper((req, res) => serviceController.restartService(req, res))
);

router.get(
  '/:name/logs',
  authenticate,
  asyncErrorWrapper((req, res) => serviceController.getServiceLogs(req, res))
);

router.get(
  '/:name/stats',
  authenticate,
  asyncErrorWrapper((req, res) => serviceController.getServiceStats(req, res))
);

export default router;
