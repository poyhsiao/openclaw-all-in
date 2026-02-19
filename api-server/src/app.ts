import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@/config/unifiedConfig';
import { errorHandler, notFoundHandler } from '@/middleware';
import healthRoutes from '@/routes/healthRoutes';
import authRoutes from '@/routes/authRoutes';
import userRoutes from '@/routes/userRoutes';
import configRoutes from '@/routes/configRoutes';
import auditRoutes from '@/routes/auditRoutes';
import serviceRoutes from '@/routes/serviceRoutes';
import dashboardRoutes from '@/routes/dashboardRoutes';

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());

  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};
