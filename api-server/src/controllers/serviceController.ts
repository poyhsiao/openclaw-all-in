import { Response } from 'express';
import { BaseController } from '@/controllers/BaseController';
import { dockerService } from '@/services/dockerService';
import { AuthenticatedRequest } from '@/types';
import {
  ServiceListResponse,
  ServiceDetailsResponse,
  ServiceLogsResponse,
  ServiceStatsResponse,
  ServiceActionResponse,
  ContainerLogsOptions,
} from '@/types/service';

/**
 * Service controller
 * Handles all service/container management operations
 */
export class ServiceController extends BaseController {
  /**
   * List all services (containers)
   */
  async listServices(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const services = await dockerService.listContainers();

      const response: ServiceListResponse = { services };
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'listServices');
    }
  }

  /**
   * Get service details
   */
  async getService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const serviceName = Array.isArray(name) ? name[0] : name;

      const service = await dockerService.getContainer(serviceName);

      const response: ServiceDetailsResponse = { service };
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'getService');
    }
  }

  /**
   * Start a service
   */
  async startService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const serviceName = Array.isArray(name) ? name[0] : name;

      await dockerService.startContainer(serviceName);

      const service = await dockerService.getContainer(serviceName);

      const response: ServiceActionResponse = {
        message: `Service '${serviceName}' started successfully`,
        service: service as any,
      };
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'startService');
    }
  }

  /**
   * Stop a service
   */
  async stopService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const serviceName = Array.isArray(name) ? name[0] : name;

      await dockerService.stopContainer(serviceName);

      const service = await dockerService.getContainer(serviceName);

      const response: ServiceActionResponse = {
        message: `Service '${serviceName}' stopped successfully`,
        service: service as any,
      };
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'stopService');
    }
  }

  /**
   * Restart a service
   */
  async restartService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const serviceName = Array.isArray(name) ? name[0] : name;

      await dockerService.restartContainer(serviceName);

      const service = await dockerService.getContainer(serviceName);

      const response: ServiceActionResponse = {
        message: `Service '${serviceName}' restarted successfully`,
        service: service as any,
      };
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'restartService');
    }
  }

  /**
   * Get service logs
   */
  async getServiceLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const serviceName = Array.isArray(name) ? name[0] : name;

      const options: ContainerLogsOptions = {
        stdout: req.query.stdout === 'true',
        stderr: req.query.stderr === 'true',
        timestamps: req.query.timestamps === 'true',
        tail: req.query.tail ? parseInt(req.query.tail as string, 10) : undefined,
        since: req.query.since ? parseInt(req.query.since as string, 10) : undefined,
      };

      const logs = await dockerService.getContainerLogs(serviceName, options);

      const response: ServiceLogsResponse = { logs };
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'getServiceLogs');
    }
  }

  /**
   * Get service stats
   */
  async getServiceStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const serviceName = Array.isArray(name) ? name[0] : name;

      const stats = await dockerService.getContainerStats(serviceName);

      const response: ServiceStatsResponse = { stats };
      this.handleSuccess(res, response);
    } catch (error) {
      this.handleError(error, res, 'getServiceStats');
    }
  }
}
