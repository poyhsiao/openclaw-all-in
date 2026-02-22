import { AuthenticatedRequest } from '@/types';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one uppercase, one lowercase, one digit, one special character
 */
export function isPasswordStrong(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate registration input
 */
export function validateRegisterInput(body: {
  email?: unknown;
  password?: unknown;
  name?: unknown;
}): { valid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {
    email: [],
    password: [],
    name: [],
  };

  // Validate email
  if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
    errors.email.push('Email is required');
  } else if (!isValidEmail(body.email.trim())) {
    errors.email.push('Invalid email format');
  }

  // Validate password
  if (!body.password || typeof body.password !== 'string') {
    errors.password.push('Password is required');
  } else {
    const passwordCheck = isPasswordStrong(body.password);
    if (!passwordCheck.valid) {
      errors.password.push(...passwordCheck.errors);
    }
  }

  // Validate name
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.name.push('Name is required');
  }

  // Remove empty error arrays
  Object.keys(errors).forEach(key => {
    if (errors[key].length === 0) {
      delete errors[key];
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate login input
 */
export function validateLoginInput(body: {
  email?: unknown;
  password?: unknown;
}): { valid: boolean; error?: string } {
  if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }

  if (!body.password || typeof body.password !== 'string' || body.password.trim() === '') {
    return { valid: false, error: 'Password is required' };
  }

  return { valid: true };
}

/**
 * Validate model input for create/update
 */
export function validateModelInput(body: {
  name?: unknown;
  provider?: unknown;
  modelId?: unknown;
  description?: unknown;
  enabled?: unknown;
}, isUpdate = false): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isUpdate || body.name !== undefined) {
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      errors.push('Name is required and must be a non-empty string');
    }
  }

  if (!isUpdate || body.provider !== undefined) {
    if (!body.provider || typeof body.provider !== 'string' || body.provider.trim() === '') {
      errors.push('Provider is required and must be a non-empty string');
    }
  }

  if (!isUpdate || body.modelId !== undefined) {
    if (!body.modelId || typeof body.modelId !== 'string' || body.modelId.trim() === '') {
      errors.push('Model ID is required and must be a non-empty string');
    }
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
    errors.push('Enabled must be a boolean');
  }

  /**
   * Validate that at least one updatable field is present for updates
   */
  if (isUpdate) {
    const hasUpdateField =
      body.name !== undefined ||
      body.provider !== undefined ||
      body.modelId !== undefined ||
      body.description !== undefined ||
      body.enabled !== undefined;

    if (!hasUpdateField) {
      errors.push('At least one field must be provided for update');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate environment variable key format
 */
export function validateEnvVarKey(key: string): boolean {
  const envVarRegex = /^[A-Z_][A-Z0-9_]*$/;
  return envVarRegex.test(key);
}

/**
 * Validate environment variable input
 */
export function validateEnvVarInput(body: {
  key?: unknown;
  value?: unknown;
  isSecret?: unknown;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.key || typeof body.key !== 'string' || body.key.trim() === '') {
    errors.push('Key is required and must be a non-empty string');
  } else {
    // Explicitly reject keys with leading or trailing whitespace
    if (body.key !== body.key.trim()) {
      errors.push('Key must not have leading or trailing whitespace');
    } else if (!validateEnvVarKey(body.key)) {
      errors.push('Key must match pattern /^[A-Z_][A-Z0-9_]*$/');
    }
  }

  // Value can be empty string but must be present and a string
  if (body.value === undefined || body.value === null) {
    errors.push('Value is required');
  } else if (typeof body.value !== 'string') {
    errors.push('Value must be a string');
  }

  // isSecret defaults to false if not provided (handled in route handler)

  return {
    valid: errors.length === 0,
    errors,
  };
}
