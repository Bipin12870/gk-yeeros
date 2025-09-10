export function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  export function isStrongPassword(pw: string) {
    // tweak policy as you like:
    return pw.length >= 6;
  }