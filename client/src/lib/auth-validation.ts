export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidRegistrationPassword(password: string): boolean {
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

export function getPasswordStrength(password: string): "none" | "weak" | "medium" | "strong" {
  if (!password) return "none";
  if (password.length < 6) return "weak";
  if (password.length < 8) return "medium";
  if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[!@#$%^&*]/.test(password)) {
    return "strong";
  }
  return "medium";
}

export function isValidLoginPassword(password: string): boolean {
  return password.length >= 6;
}

export function isVerificationCodeValid(code: string): boolean {
  return /^\d{4,8}$/.test(code.trim());
}
