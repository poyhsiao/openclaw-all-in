import { prisma } from '@/lib/prisma';

/**
 * Audit repository
 * Encapsulates all Prisma audit log queries
 */
export class AuditRepository {
  /**
   * Create audit log entry
   */
  async create(data: {
    userId?: string;
    action: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.audit.create({
      data,
      select: {
        id: true,
        userId: true,
        action: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });
  }

  /**
   * Find audit logs by user ID
   */
  async findByUserId(userId: string, options?: { skip?: number; take?: number }) {
    return prisma.audit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      ...(options?.skip !== undefined && { skip: options.skip }),
      ...(options?.take !== undefined && { take: options.take }),
    });
  }

  /**
   * Find all audit logs (admin only)
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    userId?: string;
    action?: string;
  }) {
    return prisma.audit.findMany({
      where: {
        ...(options?.userId && { userId: options.userId }),
        ...(options?.action && { action: options.action }),
      },
      orderBy: { createdAt: 'desc' },
      ...(options?.skip !== undefined && { skip: options.skip }),
      ...(options?.take !== undefined && { take: options.take }),
    });
  }

  /**
   * Count audit logs
   */
  async count(options?: { userId?: string; action?: string }): Promise<number> {
    return prisma.audit.count({
      where: {
        ...(options?.userId && { userId: options.userId }),
        ...(options?.action && { action: options.action }),
      },
    });
  }
}
