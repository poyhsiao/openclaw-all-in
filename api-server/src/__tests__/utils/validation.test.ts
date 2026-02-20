/**
 * Tests for validation utilities
 */

import {
  isValidEmail,
  isPasswordStrong,
  validateRegisterInput,
  validateLoginInput,
  validateModelInput,
  validateEnvVarInput,
} from '../../utils/validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('accepts valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('user123@test-domain.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@@example.com')).toBe(false);
      expect(isValidEmail('user example.com')).toBe(false);
    });
  });

  describe('isPasswordStrong', () => {
    it('accepts strong passwords', () => {
      const result = isPasswordStrong('StrongP@ssw0rd!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('requires minimum length', () => {
      const result = isPasswordStrong('Sh0rt!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('requires uppercase letter', () => {
      const result = isPasswordStrong('lowercase1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('requires lowercase letter', () => {
      const result = isPasswordStrong('UPPERCASE1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('requires digit', () => {
      const result = isPasswordStrong('NoDigits!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one digit');
    });

    it('requires special character', () => {
      const result = isPasswordStrong('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('catches multiple issues', () => {
      const result = isPasswordStrong('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateRegisterInput', () => {
    it('accepts valid registration input', () => {
      const result = validateRegisterInput({
        email: 'user@example.com',
        password: 'StrongP@ssw0rd!',
        name: 'John Doe',
      });
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('rejects missing email', () => {
      const result = validateRegisterInput({
        password: 'StrongP@ssw0rd!',
        name: 'John Doe',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toContain('Email is required');
    });

    it('rejects invalid email format', () => {
      const result = validateRegisterInput({
        email: 'invalid-email',
        password: 'StrongP@ssw0rd!',
        name: 'John Doe',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toContain('Invalid email format');
    });

    it('rejects missing password', () => {
      const result = validateRegisterInput({
        email: 'user@example.com',
        name: 'John Doe',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password).toContain('Password is required');
    });

    it('validates password strength', () => {
      const result = validateRegisterInput({
        email: 'user@example.com',
        password: 'weak',
        name: 'John Doe',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password.length).toBeGreaterThan(0);
    });

    it('rejects missing name', () => {
      const result = validateRegisterInput({
        email: 'user@example.com',
        password: 'StrongP@ssw0rd!',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.name).toContain('Name is required');
    });
  });

  describe('validateLoginInput', () => {
    it('accepts valid login input', () => {
      const result = validateLoginInput({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects missing email', () => {
      const result = validateLoginInput({
        password: 'password123',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('rejects missing password', () => {
      const result = validateLoginInput({
        email: 'user@example.com',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password is required');
    });
  });

  describe('validateModelInput', () => {
    it('accepts valid model input for create', () => {
      const result = validateModelInput({
        name: 'GPT-4',
        provider: 'OpenAI',
        modelId: 'gpt-4',
        description: 'Large language model',
        enabled: true,
      }, false);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('requires name for create', () => {
      const result = validateModelInput({
        provider: 'OpenAI',
        modelId: 'gpt-4',
      }, false);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required and must be a non-empty string');
    });

    it('requires provider for create', () => {
      const result = validateModelInput({
        name: 'GPT-4',
        modelId: 'gpt-4',
      }, false);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Provider is required and must be a non-empty string');
    });

    it('requires modelId for create', () => {
      const result = validateModelInput({
        name: 'GPT-4',
        provider: 'OpenAI',
      }, false);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model ID is required and must be a non-empty string');
    });

    it('validates enabled is boolean', () => {
      const result = validateModelInput({
        name: 'GPT-4',
        provider: 'OpenAI',
        modelId: 'gpt-4',
        enabled: 'true' as any,
      }, false);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Enabled must be a boolean');
    });

    it('accepts partial updates', () => {
      const result = validateModelInput({
        name: 'Updated Name',
      }, true);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects update with no fields', () => {
      const result = validateModelInput({}, true);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one field must be provided for update');
    });
  });

  describe('validateEnvVarInput', () => {
    it('accepts valid environment variable input', () => {
      const result = validateEnvVarInput({
        key: 'API_KEY',
        value: 'secret123',
        isSecret: true,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts key matching env var pattern', () => {
      const result = validateEnvVarInput({
        key: 'DATABASE_URL',
        value: 'postgresql://localhost',
      });
      expect(result.valid).toBe(true);
    });

    it('rejects invalid key format', () => {
      const result = validateEnvVarInput({
        key: 'invalid-key',
        value: 'value123',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Key must match pattern /^[A-Z_][A-Z0-9_]*$/');
    });

    it('rejects key starting with number', () => {
      const result = validateEnvVarInput({
        key: '1_INVALID_KEY',
        value: 'value123',
      });
      expect(result.valid).toBe(false);
    });

    it('rejects missing key', () => {
      const result = validateEnvVarInput({
        value: 'value123',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Key is required and must be a non-empty string');
    });

    it('rejects missing value', () => {
      const result = validateEnvVarInput({
        key: 'API_KEY',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Value is required');
    });

    it('accepts empty value', () => {
      const result = validateEnvVarInput({
        key: 'API_KEY',
        value: '',
      });
      expect(result.valid).toBe(true);
    });
  });
});
