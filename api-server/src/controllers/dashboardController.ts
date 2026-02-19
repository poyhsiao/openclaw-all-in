import { Response } from 'express';
import { BaseController } from '@/controllers/BaseController';
import { dashboardService } from '@/services/dashboardService';
import { AuthenticatedRequest } from '@/types';
import {
  OverviewResponse,
  ServicesSummaryResponse,
  HealthCheckResponse,
  ResourceStatsResponse,
} from '@/types/dashboard';

export class DashboardController extends BaseController {
  async getOverview(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const overview = await dashboardService.getOverview();

      const response: OverviewResponse = { overview };
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'getOverview');
    }
  }

  async getServicesSummary(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const services = await dashboardService.getServicesSummary();

      const response: ServicesSummaryResponse = { services };
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'getServicesSummary');
    }
  }

  async getHealthCheck(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const healthCheck = await dashboardService.getHealthCheck();

      const response: HealthCheckResponse = healthCheck;
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'getHealthCheck');
    }
  }

  async getResourceStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await dashboardService.getResourceStats();

      const response: ResourceStatsResponse = {
        stats,
        timestamp: new Date(),
      };
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'getResourceStats');
    }
  }
}
