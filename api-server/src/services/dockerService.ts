import Docker from 'dockerode';
import { config } from '@/config/unifiedConfig';
import {
  ContainerInfo,
  ContainerDetails,
  ContainerLogsOptions,
  ContainerStats,
  ServiceStatus,
} from '@/types/service';

/**
 * Docker service utility
 * Handles all Docker daemon interactions
 */
export class DockerService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker({
      socketPath: config.docker.socketPath,
    });
  }

  /**
   * Verify Docker connection
   */
  async connect(): Promise<void> {
    try {
      await this.docker.ping();
    } catch (error) {
      throw new Error(`Failed to connect to Docker daemon: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all containers
   */
  async listContainers(): Promise<ContainerInfo[]> {
    try {
      const containers = await this.docker.listContainers({ all: true });
      return containers;
    } catch (error) {
      throw new Error(`Failed to list containers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get container by name
   */
  async getContainer(name: string): Promise<ContainerDetails> {
    try {
      const container = this.docker.getContainer(name);
      const inspect = await container.inspect();
      return inspect;
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new Error(`Container '${name}' not found`);
      }
      throw new Error(`Failed to get container '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Start a container
   */
  async startContainer(name: string): Promise<void> {
    try {
      const container = this.docker.getContainer(name);
      await container.start();
    } catch (error) {
      throw new Error(`Failed to start container '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stop a container
   */
  async stopContainer(name: string): Promise<void> {
    try {
      const container = this.docker.getContainer(name);
      await container.stop();
    } catch (error) {
      throw new Error(`Failed to stop container '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Restart a container
   */
  async restartContainer(name: string): Promise<void> {
    try {
      const container = this.docker.getContainer(name);
      await container.restart();
    } catch (error) {
      throw new Error(`Failed to restart container '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(name: string, options: ContainerLogsOptions = {}): Promise<string> {
    try {
      const container = this.docker.getContainer(name);
      const inspect = await container.inspect();
      const isTty = inspect.Config.Tty ?? false;

      const logs = await container.logs({
        stdout: options.stdout ?? true,
        stderr: options.stderr ?? true,
        since: options.since,
        timestamps: options.timestamps ?? false,
        tail: options.tail ?? 100,
      });

      if (isTty) {
        return logs.toString('utf-8');
      }

      // For non-TTY containers, manually parse the Docker multiplexed buffer format
      // Format: [1-byte stream type, 3 padding bytes, 4-byte BE size, payload]
      let result = '';
      let offset = 0;
      const logsBuffer = Buffer.isBuffer(logs) ? logs : Buffer.from(logs);

      while (offset < logsBuffer.length) {
        // Check if we have at least 8 bytes for the header
        if (offset + 8 > logsBuffer.length) break;

        // Read header
        const streamType = logsBuffer[offset];
        // Skip 3 padding bytes (offset + 1 to offset + 3)
        const size = logsBuffer.readUInt32BE(offset + 4);

        // Move to payload
        offset += 8;

        // Check if we have enough bytes for the payload
        if (offset + size > logsBuffer.length) break;

        // Extract payload
        const payload = logsBuffer.subarray(offset, offset + size);
        result += payload.toString('utf-8');

        // Move to next frame
        offset += size;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get logs for container '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get container resource statistics
   */
  async getContainerStats(name: string): Promise<ContainerStats> {
    try {
      const container = this.docker.getContainer(name);
      const stats = await container.stats({ stream: false });
      return stats;
    } catch (error) {
      throw new Error(`Failed to get stats for container '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get container status
   */
  async getContainerStatus(name: string): Promise<ServiceStatus> {
    try {
      const container = this.docker.getContainer(name);
      const inspect = await container.inspect();
      const state = inspect.State;

      if (state.Paused) return ServiceStatus.PAUSED;
      if (state.Running) return ServiceStatus.RUNNING;
      if (state.Restarting) return ServiceStatus.RESTARTING;
      if (state.Dead) return ServiceStatus.DEAD;
      if (state.Status === 'created') return ServiceStatus.CREATED;
      if (state.Status === 'exited') return ServiceStatus.EXITED;
      if (state.Status === 'removing') return ServiceStatus.REMOVING;

      return ServiceStatus.STOPPED;
    } catch (error) {
      throw new Error(`Failed to get status for container '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const dockerService = new DockerService();
