/**
 * Valida la complejidad de la contraseña según políticas de seguridad OWASP.
 * Requiere:
 * - Mínimo 8 caracteres
 * - Alfanumérico (letras y números)
 * - Al menos 1 símbolo
 */
export function validatePasswordPolicy(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener letras y números (alfanumérica).' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos un símbolo especial (ej: !@#$%).' };
  }

  return { isValid: true, message: 'Contraseña válida' };
}
