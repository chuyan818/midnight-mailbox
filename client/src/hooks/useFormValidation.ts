/**
 * 表单实时校验Hook
 * 为Register和UserLogin页面提供统一的校验逻辑
 */

import { useState, useCallback } from 'react';

export interface ValidationError {
  email?: string;
  password?: string;
  confirmPassword?: string;
  verificationCode?: string;
}

export const useFormValidation = () => {
  const [errors, setErrors] = useState<ValidationError>({});

  // 邮箱校验
  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) return '邮箱不能为空';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return '邮箱格式不正确';
    return undefined;
  }, []);

  // 密码强度校验
  const validatePasswordStrength = useCallback((password: string): { strength: 'weak' | 'medium' | 'strong'; message: string } => {
    if (!password) return { strength: 'weak', message: '密码不能为空' };
    
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let message = '弱';
    
    // 检查长度
    if (password.length >= 8) {
      strength = 'medium';
      message = '中';
    }
    
    // 检查复杂性
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    
    const complexityScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (password.length >= 12 && complexityScore >= 3) {
      strength = 'strong';
      message = '强';
    }
    
    return { strength, message };
  }, []);

  // 密码校验
  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) return '密码不能为空';
    if (password.length < 8) return '密码至少需要8个字符';
    return undefined;
  }, []);

  // 密码一致性校验
  const validatePasswordMatch = useCallback((password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return '请确认密码';
    if (password !== confirmPassword) return '两次输入的密码不一致';
    return undefined;
  }, []);

  // 验证码校验
  const validateVerificationCode = useCallback((code: string): string | undefined => {
    if (!code) return '验证码不能为空';
    if (!/^\d{6}$/.test(code)) return '验证码格式不正确（6位数字）';
    return undefined;
  }, []);

  // 实时校验邮箱
  const validateEmailField = useCallback((email: string) => {
    const error = validateEmail(email);
    setErrors(prev => ({ ...prev, email: error }));
    return !error;
  }, [validateEmail]);

  // 实时校验密码
  const validatePasswordField = useCallback((password: string) => {
    const error = validatePassword(password);
    setErrors(prev => ({ ...prev, password: error }));
    return !error;
  }, [validatePassword]);

  // 实时校验密码一致性
  const validatePasswordMatchField = useCallback((password: string, confirmPassword: string) => {
    const error = validatePasswordMatch(password, confirmPassword);
    setErrors(prev => ({ ...prev, confirmPassword: error }));
    return !error;
  }, [validatePasswordMatch]);

  // 实时校验验证码
  const validateVerificationCodeField = useCallback((code: string) => {
    const error = validateVerificationCode(code);
    setErrors(prev => ({ ...prev, verificationCode: error }));
    return !error;
  }, [validateVerificationCode]);

  // 清除错误
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    setErrors,
    validateEmail,
    validatePassword,
    validatePasswordStrength,
    validatePasswordMatch,
    validateVerificationCode,
    validateEmailField,
    validatePasswordField,
    validatePasswordMatchField,
    validateVerificationCodeField,
    clearErrors,
  };
};
