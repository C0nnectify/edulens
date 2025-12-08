/**
 * JWT Utilities
 *
 * Helper functions for creating and verifying JWT tokens
 * for communication with the AI service
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';
const JWT_ALGORITHM = 'HS256';

/**
 * Create JWT token for AI service authentication
 */
export async function createJWTToken(userId: string): Promise<string> {
  const payload = {
    user_id: userId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM });
}

/**
 * Verify JWT token
 */
export async function verifyJWTToken(token: string): Promise<{ user_id: string } | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as {
      user_id: string;
      exp: number;
      iat: number;
    };

    return { user_id: decoded.user_id };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Decode JWT token without verification (for debugging)
 */
export function decodeJWTToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
}
