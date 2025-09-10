export function friendlyAuthError(e: any): string {
    const code = e?.code || '';
    switch (code) {
      case 'auth/email-already-in-use': return 'That email is already registered.';
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      case 'auth/user-not-found': return 'No account found for that email.';
      case 'auth/wrong-password': return 'Incorrect password. Please try again.';
      case 'auth/network-request-failed': return 'Network error. Check your internet and try again.';
      case 'auth/too-many-requests': return 'Too many attempts. Please wait and try again.';
      default: return e?.message || 'Something went wrong. Please try again.';
    }
  }