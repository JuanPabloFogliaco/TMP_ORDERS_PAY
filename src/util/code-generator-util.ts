// utils/code-generator.util.ts
export function generateVerificationCode(): string {
  const randomCode = Math.random().toString(36).substr(2, 6).toUpperCase(); // Genera un código aleatorio
  return randomCode;
}
