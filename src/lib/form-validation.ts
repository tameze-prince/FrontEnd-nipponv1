/**
 * Form Validation Utilities
 * Helper functions for form validation
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (min 8 chars, uppercase, lowercase, number)
export const validatePassword = (password: string): { isValid: boolean; strength: 'weak' | 'medium' | 'strong' } => {
  if (password.length < 8) return { isValid: false, strength: 'weak' };

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  const isValid = hasUppercase && hasLowercase && hasNumber;
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (isValid) {
    strength = hasSpecialChar ? 'strong' : 'medium';
  }

  return { isValid, strength };
};

// Phone validation (basic pattern)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s+()-]{7,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Price validation
export const validatePrice = (price: string | number): boolean => {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(priceNum) && priceNum > 0;
};

// Date validation
export const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

// SKU validation
export const validateSKU = (sku: string): boolean => {
  return /^[A-Z0-9-]{3,}$/.test(sku);
};

// Username validation
export const validateUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
};

// Postal code validation (basic)
export const validatePostalCode = (code: string): boolean => {
  return /^[A-Z0-9\s-]{3,}$/.test(code.toUpperCase());
};

// Required field
export const validateRequired = (value: string | number | undefined | null): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== undefined && value !== null;
};

// Min length
export const validateMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

// Max length
export const validateMaxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

// Array not empty
export const validateArrayNotEmpty = (arr: any[]): boolean => {
  return Array.isArray(arr) && arr.length > 0;
};

// Matches another field
export const validateMatches = (value: string, otherValue: string): boolean => {
  return value === otherValue;
};

// Min value
export const validateMinValue = (value: number, min: number): boolean => {
  return value >= min;
};

// Max value
export const validateMaxValue = (value: number, max: number): boolean => {
  return value <= max;
};

// Percentage (0-100)
export const validatePercentage = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

// Get error message for validation
export const getErrorMessage = (field: string, validationType: string, additional?: any): string => {
  const messages: Record<string, string> = {
    'email-invalid': 'Please enter a valid email address',
    'password-invalid': 'Password must be at least 8 characters with uppercase, lowercase, and number',
    'password-mismatch': 'Passwords do not match',
    'phone-invalid': 'Please enter a valid phone number',
    'url-invalid': 'Please enter a valid URL',
    'price-invalid': 'Please enter a valid price',
    'date-invalid': 'Please enter a valid date',
    'sku-invalid': 'SKU must contain only letters, numbers, and hyphens',
    'username-invalid': 'Username must be 3-20 characters with letters, numbers, dash, underscore',
    'postal-invalid': 'Please enter a valid postal code',
    'required-missing': `${field} is required`,
    'min-length': `${field} must be at least ${additional?.min} characters`,
    'max-length': `${field} must not exceed ${additional?.max} characters`,
    'array-empty': `${field} cannot be empty`,
    'percentage-invalid': 'Value must be between 0 and 100',
  };

  return messages[validationType] || `${field} is invalid`;
};
