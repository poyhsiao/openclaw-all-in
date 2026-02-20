import { AuditRepository } from '@/repositories/AuditRepository';

/**
 * Audit service
 * Contains business logic for audit logging
 */
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  /**
   * Log user action
   */
  async logAction(data: {
    userId?: string;
    action: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const detailsString = data.details ? JSON.stringify(data.details) : undefined;

    return this.auditRepository.create({
      userId: data.userId,
      action: data.action,
      details: detailsString,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.auditRepository.findByUserId(userId, { skip, take: limit }),
      this.auditRepository.count({ userId }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all audit logs (admin only)
   */
  async getAllAuditLogs(options?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.auditRepository.findAll({
        skip,
        take: limit,
        userId: options?.userId,
        action: options?.action,
      }),
      this.auditRepository.count({
        userId: options?.userId,
        action: options?.action,
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
