import { Response } from 'express';

/**
 * Base controller class
 * All controllers must extend this class
 * Provides common response handling methods
 */
export abstract class BaseController {
  /**
   * Handle successful response
   */
  protected handleSuccess(res: Response, data: unknown, statusCode = 200): void {
    res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Handle error response
   */
  protected handleError(
    error: unknown,
    res: Response,
    context: string
  ): void {
    console.error(`Error in ${context}:`, error);

    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    res.status(statusCode).json({
      success: false,
      error: {
        message,
      },
    });
  }

  /**
   * Handle validation error
   */
  protected handleValidationError(
    res: Response,
    message: string,
    errors?: Record<string, string[]>
  ): void {
    res.status(400).json({
      success: false,
      error: {
        message,
        ...(errors && { details: errors }),
      },
    });
  }

  /**
   * Handle not found error
   */
  protected handleNotFound(res: Response, message = 'Resource not found'): void {
    res.status(404).json({
      success: false,
      error: {
        message,
      },
    });
  }

  /**
   * Handle bad request error
   */
  protected handleBadRequest(res: Response, message: string): void {
    res.status(400).json({
      success: false,
      error: {
        message,
      },
    });
  }
}
