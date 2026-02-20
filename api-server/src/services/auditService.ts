import { AuditRepository } from '@/repositories/AuditRepository';

/**
 * Audit service
 * Contains business logic for audit logging
 */
export class AuditService {
  private readonly MAX_LIMIT = 100;

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
  async getUserAuditLogs(userId: string, page?: number, limit?: number) {
    const validatedPage = Math.max(1, Math.floor(page || 1));
    const validatedLimit = Math.min(
      Math.max(1, Math.floor(limit || 10)),
      this.MAX_LIMIT
    );
    const skip = (validatedPage - 1) * validatedLimit;

    const [logs, total] = await Promise.all([
      this.auditRepository.findByUserId(userId, { skip, take: validatedLimit }),
      this.auditRepository.count({ userId }),
    ]);

    return {
      logs,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / validatedLimit),
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
    const validatedPage = Math.max(1, Math.floor(options?.page ?? 1));
    const validatedLimit = Math.min(
      Math.max(1, Math.floor(options?.limit ?? 10)),
      this.MAX_LIMIT
    );
    const skip = (validatedPage - 1) * validatedLimit;

    const [logs, total] = await Promise.all([
      this.auditRepository.findAll({
        skip,
        take: validatedLimit,
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
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / validatedLimit),
      },
    };
  }
}
