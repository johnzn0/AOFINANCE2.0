export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  errors: string[];
}

export function validatePasswordRequirements(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors: string[] = [];

  if (!hasMinLength) {
    errors.push('A senha deve ter no mínimo 8 caracteres.');
  }
  if (!hasUppercase) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula.');
  }
  if (!hasLowercase) {
    errors.push('A senha deve conter pelo menos uma letra minúscula.');
  }
  if (!hasNumber) {
    errors.push('A senha deve conter pelo menos um número.');
  }
  if (!hasSpecialChar) {
    errors.push('A senha deve conter pelo menos um caractere especial (!@#$%^&*...).');
  }

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    errors,
  };
}
