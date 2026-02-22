import { Router, Request, Response } from 'express';
import { BaseController } from '@/controllers/BaseController';
import { asyncErrorWrapper, authenticate } from '@/middleware';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken } from '@/utils/auth';
import { AuthenticatedRequest, LoginRequestBody, RegisterRequestBody, RefreshTokenRequestBody, UserRole } from '@/types';
import { validateRegisterInput, validateLoginInput } from '@/utils/validation';

class AuthController extends BaseController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password }: LoginRequestBody = req.body;

    // Validate input before any database access
    const validation = validateLoginInput(req.body);
    if (!validation.valid) {
      this.handleValidationError(res, validation.error || 'Invalid credentials');
      return;
    }

    // Normalize email (trim and lowercase) to match registration behavior
    const normalizedEmail = email!.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      this.handleError(new Error('Invalid credentials'), res, 'login');
      return;
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      this.handleError(new Error('Invalid credentials'), res, 'login');
      return;
    }

    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    this.handleSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  }

  async register(req: Request, res: Response): Promise<void> {
    const { email, password, name }: RegisterRequestBody = req.body;

    // Validate input
    const validation = validateRegisterInput(req.body);
    if (!validation.valid) {
      this.handleValidationError(res, 'Validation failed', validation.errors);
      return;
    }

    const normalizedEmail = email!.trim();
    const normalizedName = name!.trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      this.handleValidationError(res, 'Email already registered');
      return;
    }

    const passwordHash = await hashPassword(password!);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: normalizedName,
        role: UserRole.USER,
      },
    });

    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    this.handleSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    }, 201);
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { refreshToken }: RefreshTokenRequestBody = req.body;

    // Require and trim refresh token
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      this.handleValidationError(res, 'Refresh token is required');
      return;
    }

    const token = refreshToken.trim();

    await prisma.session.deleteMany({
      where: { token },
    });

    this.handleSuccess(res, { message: 'Logged out successfully' });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken }: RefreshTokenRequestBody = req.body;

    if (!refreshToken) {
      this.handleValidationError(res, 'Refresh token is required');
      return;
    }

    // Trim and validate token early for consistency with logout
    const token = refreshToken.trim();

    try {
      verifyRefreshToken(token);
    } catch (error) {
      this.handleError(error, res, 'refresh');
      return;
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      this.handleError(new Error('Invalid or expired refresh token'), res, 'refresh');
      return;
    }

    const user = session.user;

    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    this.handleSuccess(res, { accessToken });
  }

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      this.handleError(new Error('Not authenticated'), res, 'me');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      this.handleNotFound(res, 'User not found');
      return;
    }

    this.handleSuccess(res, { user });
  }
}

const authController = new AuthController();
const router = Router();

router.post(
  '/login',
  asyncErrorWrapper((req, res) => authController.login(req, res))
);

router.post(
  '/register',
  asyncErrorWrapper((req, res) => authController.register(req, res))
);

router.post(
  '/logout',
  asyncErrorWrapper((req, res) => authController.logout(req, res))
);

router.post(
  '/refresh',
  asyncErrorWrapper((req, res) => authController.refresh(req, res))
);

router.get(
  '/me',
  authenticate,
  asyncErrorWrapper((req, res) => authController.me(req, res))
);

export default router;
