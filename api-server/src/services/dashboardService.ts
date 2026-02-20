import { PrismaClient } from '@prisma/client';
import { dockerService } from './dockerService';
import {
  OverviewStats,
  ServiceSummary,
  ServiceHealth,
  HealthStatus,
  ResourceStats,
  RecentActivity,
} from '@/types/dashboard';
import { ServiceStatus } from '@/types/service';

const prisma = new PrismaClient();

interface CachedData<T> {
  data: T;
  timestamp: number;
}

class DashboardService {
  private cache: Map<string, CachedData<unknown>> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async getOverview(): Promise<OverviewStats> {
    const cacheKey = 'overview';
    const cached = this.getFromCache<OverviewStats>(cacheKey);
    if (cached) return cached;

    const containers = await dockerService.listContainers();
    const userCount = await prisma.user.count();
    const recentActivityCount = await prisma.audit.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const runningServices = containers.filter(
      (c) => c.State === 'running'
    ).length;
    const stoppedServices = containers.filter(
      (c) => c.State !== 'running'
    ).length;

    const overview: OverviewStats = {
      totalServices: containers.length,
      runningServices,
      stoppedServices,
      totalUsers: userCount,
      recentActivity: recentActivityCount,
    };

    this.setCache(cacheKey, overview);
    return overview;
  }

  async getServicesSummary(): Promise<ServiceSummary[]> {
    const cacheKey = 'services-summary';
    const cached = this.getFromCache<ServiceSummary[]>(cacheKey);
    if (cached) return cached;

    const containers = await dockerService.listContainers();

    const services: ServiceSummary[] = containers.map((container) => {
      const uptime = container.State === 'running' && container.Status
        ? this.parseUptime(container.Status)
        : undefined;

      return {
        name: container.Names[0]?.replace(/^\//, '') || container.Id.substring(0, 12),
        status: this.mapContainerStatus(container.State),
        image: container.Image,
        ports: container.Ports.map((p) =>
          p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}/${p.Type}` : `${p.PrivatePort}/${p.Type}`
        ),
        uptime,
      };
    });

    this.setCache(cacheKey, services);
    return services;
  }

  async getHealthCheck(): Promise<{ services: ServiceHealth[]; overall: HealthStatus }> {
    const cacheKey = 'health-check';
    const cached = this.getFromCache<{ services: ServiceHealth[]; overall: HealthStatus }>(cacheKey);
    if (cached) return cached;

    const containers = await dockerService.listContainers();
    const services: ServiceHealth[] = [];

    for (const container of containers) {
      const name = container.Names[0]?.replace(/^\//, '') || container.Id.substring(0, 12);
      const status = this.mapContainerStatus(container.State);
      const healthStatus = this.mapToHealthStatus(status);

      let uptime: number | undefined;
      let lastRestart: Date | undefined;

      if (container.State === 'running' && container.Status) {
        uptime = this.parseUptime(container.Status);
      }

      const restartCount = 0;
      if (restartCount > 0 && container.Status) {
        const match = container.Status.match(/(\d+) (second|minute|hour|day)s? ago/);
        if (match) {
          const value = parseInt(match[1], 10);
          const unit = match[2];
          const now = Date.now();
          let ms = 0;

          switch (unit) {
            case 'second':
              ms = value * 1000;
              break;
            case 'minute':
              ms = value * 60 * 1000;
              break;
            case 'hour':
              ms = value * 60 * 60 * 1000;
              break;
            case 'day':
              ms = value * 24 * 60 * 60 * 1000;
              break;
          }

          lastRestart = new Date(now - ms);
        }
      }

      services.push({
        name,
        status: healthStatus,
        uptime,
        restartCount,
        lastRestart,
      });
    }

    const overall = this.calculateOverallHealth(services);

    const result = { services, overall };
    this.setCache(cacheKey, result);
    return result;
  }

  async getResourceStats(): Promise<ResourceStats> {
    const cacheKey = 'resource-stats';
    const cached = this.getFromCache<ResourceStats>(cacheKey);
    if (cached) return cached;

    const containers = await dockerService.listContainers();
    const runningContainers = containers.filter((c) => c.State === 'running');

    let totalCpuUsage = 0;
    let totalMemoryUsed = 0;
    let totalRx = 0;
    let totalTx = 0;

    for (const container of runningContainers) {
      try {
        const stats = await dockerService.getContainerStats(
          container.Names[0]?.replace(/^\//, '') || container.Id.substring(0, 12)
        );

        if (stats.cpu_stats && stats.precpu_stats) {
          const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
          const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
          const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
          totalCpuUsage += Math.max(0, cpuPercent);
        }

        if (stats.memory_stats) {
          const memoryUsed = stats.memory_stats.usage || 0;
          totalMemoryUsed += memoryUsed;
        }

        if (stats.networks) {
          for (const network of Object.values(stats.networks)) {
            totalRx += network.rx_bytes || 0;
            totalTx += network.tx_bytes || 0;
          }
        }
      } catch {
        // Skip containers that fail to provide stats
      }
    }

    const cpuCores = require('os').cpus().length;
    const totalMemory = require('os').totalmem();

    const resourceStats: ResourceStats = {
      cpu: {
        usage: Math.min(100, totalCpuUsage),
        cores: cpuCores,
      },
      memory: {
        used: totalMemoryUsed,
        total: totalMemory,
        usage: (totalMemoryUsed / totalMemory) * 100,
      },
      disk: {
        used: 0,
        total: 0,
        usage: 0,
      },
      network: {
        rx: totalRx,
        tx: totalTx,
      },
    };

    this.setCache(cacheKey, resourceStats);
    return resourceStats;
  }

  async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
    const audits = await prisma.audit.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
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

    return audits.map((audit) => ({
      id: audit.id,
      action: audit.action,
      userId: audit.userId || undefined,
      timestamp: audit.createdAt,
      details: audit.details || undefined,
    }));
  }

  private mapContainerStatus(state: string): ServiceStatus {
    switch (state.toLowerCase()) {
      case 'running':
        return ServiceStatus.RUNNING;
      case 'paused':
        return ServiceStatus.PAUSED;
      case 'restarting':
        return ServiceStatus.RESTARTING;
      case 'dead':
        return ServiceStatus.DEAD;
      case 'created':
        return ServiceStatus.CREATED;
      case 'exited':
        return ServiceStatus.EXITED;
      case 'removing':
        return ServiceStatus.REMOVING;
      default:
        return ServiceStatus.STOPPED;
    }
  }

  private mapToHealthStatus(status: ServiceStatus): HealthStatus {
    switch (status) {
      case ServiceStatus.RUNNING:
        return HealthStatus.HEALTHY;
      case ServiceStatus.PAUSED:
      case ServiceStatus.RESTARTING:
        return HealthStatus.DEGRADED;
      case ServiceStatus.DEAD:
      case ServiceStatus.EXITED:
        return HealthStatus.UNHEALTHY;
      default:
        return HealthStatus.UNKNOWN;
    }
  }

  private calculateOverallHealth(services: ServiceHealth[]): HealthStatus {
    if (services.length === 0) return HealthStatus.UNKNOWN;

    const healthyCount = services.filter((s) => s.status === HealthStatus.HEALTHY).length;
    const unhealthyCount = services.filter((s) => s.status === HealthStatus.UNHEALTHY).length;

    if (unhealthyCount > 0) return HealthStatus.UNHEALTHY;
    if (healthyCount === services.length) return HealthStatus.HEALTHY;
    return HealthStatus.DEGRADED;
  }

  private parseUptime(status: string): number {
    const match = status.match(/Up (\d+)(?:\.(\d+))? (second|minute|hour|day)s?/);
    if (!match) return 0;

    const value = parseFloat(match[1] + (match[2] ? `.${match[2]}` : ''));
    const unit = match[3];

    switch (unit) {
      case 'second':
        return value * 1000;
      case 'minute':
        return value * 60 * 1000;
      case 'hour':
        return value * 60 * 60 * 1000;
      case 'day':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }
}

export const dashboardService = new DashboardService();
