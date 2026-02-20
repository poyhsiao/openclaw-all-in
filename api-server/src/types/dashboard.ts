import { ServiceStatus } from './service';

/**
 * Dashboard overview statistics
 */
export interface OverviewStats {
  totalServices: number;
  runningServices: number;
  stoppedServices: number;
  totalUsers: number;
  recentActivity: number;
}

/**
 * Service summary item
 */
export interface ServiceSummary {
  name: string;
  status: ServiceStatus;
  image: string;
  ports: string[];
  uptime?: number;
}

/**
 * Services summary response
 */
export interface ServicesSummaryResponse {
  services: ServiceSummary[];
}

/**
 * Health check status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
  UNKNOWN = 'unknown',
}

/**
 * Service health check result
 */
export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  uptime?: number;
  restartCount: number;
  lastRestart?: Date;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  services: ServiceHealth[];
  overall: HealthStatus;
}

/**
 * Resource usage statistics
 */
export interface ResourceStats {
  cpu: {
    usage: number; // percentage
    cores: number;
  };
  memory: {
    used: number; // bytes
    total: number; // bytes
    usage: number; // percentage
  };
  disk: {
    used: number; // bytes
    total: number; // bytes
    usage: number; // percentage
  };
  network: {
    rx: number; // bytes received
    tx: number; // bytes transmitted
  };
}

/**
 * Resource stats response
 */
export interface ResourceStatsResponse {
  stats: ResourceStats;
  timestamp: Date;
}

/**
 * Overview response
 */
export interface OverviewResponse {
  overview: OverviewStats;
}

/**
 * Recent activity item
 */
export interface RecentActivity {
  id: string;
  action: string;
  userId?: string;
  timestamp: Date;
  details?: string;
}
