import { UserRepository } from '@/repositories/UserRepository';
import { hashPassword, comparePassword } from '@/utils/auth';
import { UserRole } from '@/types';

/**
 * User service
 * Contains business logic for user management
 */
export class UserService {
  private readonly MAX_LIMIT = 100;

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Get user by ID
   */
  async getById(id: string) {
    return this.userRepository.findById(id);
  }

  /**
   * Get user by email (includes password hash for auth)
   */
  async getByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  /**
   * List all users with pagination
   */
  async listUsers(page = 1, limit = 10) {
    const validatedPage = Math.max(1, Math.floor(page || 1));
    const validatedLimit = Math.min(
      Math.max(1, Math.floor(limit || 10)),
      this.MAX_LIMIT
    );
    const skip = (validatedPage - 1) * validatedLimit;

    const [users, total] = await Promise.all([
      this.userRepository.findAll({ skip, take: validatedLimit }),
      this.userRepository.count(),
    ]);

    return {
      users,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / validatedLimit),
      },
    };
  }

  /**
   * Create new user
   */
  async createUser(data: {
    email: string;
    password: string;
    name?: string;
    role?: UserRole;
  }) {
    // Check for existing email
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const passwordHash = await hashPassword(data.password);

    return this.userRepository.create({
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role || UserRole.USER,
    });
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: {
    email?: string;
    name?: string;
    role?: UserRole;
  }) {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    if (data.email && data.email !== existingUser.email) {
      const emailExists = await this.userRepository.emailExists(data.email, id);
      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    return this.userRepository.update(id, data);
  }

  /**
   * Update current user's profile
   */
  async updateProfile(userId: string, data: {
    name?: string;
    email?: string;
  }) {
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    if (data.email && data.email !== existingUser.email) {
      const emailExists = await this.userRepository.emailExists(data.email, userId);
      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    return this.userRepository.update(userId, data);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.passwordHash) {
      throw new Error('User not found');
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);
    return this.userRepository.update(userId, { passwordHash });
  }

  /**
   * Delete user
   */
  async deleteUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userRepository.delete(id);
  }

  /**
   * Validate user data
   */
  validateUserData(data: { email?: string; name?: string; role?: string }): void {
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.role && !Object.values(UserRole).includes(data.role as UserRole)) {
      throw new Error('Invalid role');
    }
  }

  /**
   * Validate password
   */
  validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
