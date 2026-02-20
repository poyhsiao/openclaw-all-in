import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types';

/**
 * User repository
 * Encapsulates all Prisma user queries
 */
export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find user by email (includes password hash for auth)
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by email (public fields only)
   */
  async findByEmailPublic(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * List all users
   */
  async findAll(options?: { skip?: number; take?: number }) {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      ...(options?.skip !== undefined && { skip: options.skip }),
      ...(options?.take !== undefined && { take: options.take }),
    });
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    return prisma.user.count();
  }

  /**
   * Create new user
   */
  async create(data: {
    email: string;
    passwordHash: string;
    name?: string;
    role?: UserRole;
  }) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: {
    email?: string;
    name?: string;
    role?: UserRole;
    passwordHash?: string;
  }) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Check if email exists (excluding current user)
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return false;
    if (excludeId && user.id === excludeId) return false;
    return true;
  }
}
