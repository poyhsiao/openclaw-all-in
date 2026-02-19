import type Docker from 'dockerode';

/**
 * Service/container status
 */
export enum ServiceStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  PAUSED = 'paused',
  RESTARTING = 'restarting',
  DEAD = 'dead',
  CREATED = 'created',
  EXITED = 'exited',
  REMOVING = 'removing',
}

/**
 * Container information (re-export from dockerode)
 */
export type ContainerInfo = Docker.ContainerInfo;

/**
 * Container details (re-export from dockerode)
 */
export type ContainerDetails = Docker.ContainerInspectInfo;

/**
 * Container statistics (re-export from dockerode)
 */
export type ContainerStats = Docker.ContainerStats;

/**
 * Container logs options
 */
export interface ContainerLogsOptions {
  stdout?: boolean;
  stderr?: boolean;
  since?: number;
  timestamps?: boolean;
  tail?: number;
}

/**
 * Service list response
 */
export interface ServiceListResponse {
  services: ContainerInfo[];
}

/**
 * Service details response
 */
export interface ServiceDetailsResponse {
  service: ContainerDetails;
}

/**
 * Service logs response
 */
export interface ServiceLogsResponse {
  logs: string;
}

/**
 * Service stats response
 */
export interface ServiceStatsResponse {
  stats: ContainerStats;
}

/**
 * Service action response
 */
export interface ServiceActionResponse {
  message: string;
  service: ContainerInfo;
}
