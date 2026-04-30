'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader, Check, X } from 'lucide-react';
import { validateEmail, validatePassword, validatePhone, validateRequired, validateMinLength } from '@/lib/form-validation';
import { Button } from '@/components/ui/button';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
}

interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
}

export default function RegisterForm({ onSubmit, loading = false, error }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  const checkPasswordStrength = (pass: string): PasswordStrength => {
    let score = 0;

    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*]/.test(pass)) score++;

    const strengthMap: Record<number, PasswordStrength> = {
      0: { score: 0, label: 'Weak', color: 'bg-red-500' },
      1: { score: 1, label: 'Weak', color: 'bg-red-500' },
      2: { score: 2, label: 'Fair', color: 'bg-orange-500' },
      3: { score: 3, label: 'Good', color: 'bg-yellow-500' },
      4: { score: 4, label: 'Strong', color: 'bg-green-500' },
      5: { score: 5, label: 'Strong', color: 'bg-green-600' },
    };

    return strengthMap[score];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(formData.firstName)) {
      newErrors.firstName = 'First name is required';
    }

    if (!validateRequired(formData.lastName)) {
      newErrors.lastName = 'Last name is required';
    }

    if (!validateRequired(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validateRequired(formData.phone)) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!validateRequired(formData.password)) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    if (!validateRequired(formData.confirmPassword)) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.currentTarget;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // Check password strength when typing password
    if (name === 'password') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* First & Last Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              className={`w-full pl-9 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className={`w-full pl-9 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className={`w-full pl-9 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone (WhatsApp)
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1234567890"
            className={`w-full pl-9 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full pl-9 pr-10 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}

        {/* Password Strength */}
        {passwordStrength && formData.password && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className={`h-full ${passwordStrength.color} transition-all`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">{passwordStrength.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full pl-9 pr-10 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}

        {/* Password Match Indicator */}
        {formData.password && formData.confirmPassword && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {formData.password === formData.confirmPassword ? (
              <>
                <Check size={16} className="text-green-500" />
                <span className="text-green-600">Passwords match</span>
              </>
            ) : (
              <>
                <X size={16} className="text-red-500" />
                <span className="text-red-600">Passwords do not match</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="flex items-start gap-2">
        <input
          id="acceptTerms"
          type="checkbox"
          name="acceptTerms"
          checked={formData.acceptTerms}
          onChange={handleChange}
          className="w-4 h-4 mt-1 text-orange-500 rounded focus:ring-orange-500"
        />
        <label htmlFor="acceptTerms" className="text-xs text-gray-700">
          I agree to the <a href="#" className="text-orange-500 hover:underline">Terms and Conditions</a> and{' '}
          <a href="#" className="text-orange-500 hover:underline">Privacy Policy</a>
        </label>
      </div>
      {errors.acceptTerms && <p className="text-red-500 text-xs">{errors.acceptTerms}</p>}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded flex items-center justify-center gap-2"
      >
        {loading && <Loader size={18} className="animate-spin" />}
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
