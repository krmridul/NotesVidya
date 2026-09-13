import crypto from 'crypto';

export const OTP_CONFIG = {
  DIGITS: 6,
  EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  RESEND_COOLDOWN_MS: 60 * 1000, // 60 seconds
  MAX_ATTEMPTS: 5,
  MAX_RESENDS: 5
};

/**
 * Generate a cryptographically secure 6-digit OTP string.
 * Strictly in range 100000 to 999999.
 */
export function generateSecureOtp(): string {
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
}

/**
 * Hash an OTP using HMAC-SHA256 with a unique salt.
 * The plaintext OTP is NEVER stored in the database.
 */
export function hashOtp(otp: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', salt).update(otp.trim()).digest('hex');
  return { hash, salt };
}

/**
 * Timing-safe comparison to verify the entered OTP against the stored hash.
 */
export function verifyOtpHash(enteredOtp: string, storedHash: string, salt: string): boolean {
  if (!enteredOtp || !storedHash || !salt) {
    return false;
  }
  const cleanOtp = enteredOtp.trim();
  if (cleanOtp.length !== OTP_CONFIG.DIGITS) {
    return false;
  }
  const calculatedHash = crypto.createHmac('sha256', salt).update(cleanOtp).digest('hex');
  
  const hashBuffer = Buffer.from(storedHash, 'hex');
  const calcBuffer = Buffer.from(calculatedHash, 'hex');

  if (hashBuffer.length !== calcBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, calcBuffer);
}
