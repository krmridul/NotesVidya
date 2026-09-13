import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { User } from '../src/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'digital-pdf-store-secure-token-secret-key-2025';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'kinetic-cooler-mxctm';
const ADMIN_EMAILS = ['mrityu7462@gmail.com'];

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'customer' | 'admin';
  exp: number;
}

export function signToken(payload: Omit<TokenPayload, 'exp'>, expiresInHours = 72): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const data: TokenPayload = { ...payload, exp };
  const encodedData = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(encodedData).digest('base64url');
  return `${encodedData}.${signature}`;
}

export function verifyFirebaseToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadRaw = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadRaw);

    const nowSeconds = Math.floor(Date.now() / 1000);
    // Expiration check (with 60s clock skew tolerance)
    if (payload.exp && payload.exp < nowSeconds - 60) {
      return null;
    }

    // Issuer and audience check for the provisioned Firebase project
    const expectedIss = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
    if (payload.iss !== expectedIss || payload.aud !== FIREBASE_PROJECT_ID) {
      if (payload.aud !== FIREBASE_PROJECT_ID && !payload.iss?.includes(FIREBASE_PROJECT_ID)) {
        return null;
      }
    }

    const userId = payload.user_id || payload.sub;
    if (!userId) return null;

    const email = (payload.email || '').trim().toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(email) || payload.admin === true;

    return {
      userId,
      email,
      role: isAdmin ? 'admin' : 'customer',
      exp: payload.exp || nowSeconds + 3600
    };
  } catch {
    return null;
  }
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      return verifyFirebaseToken(token);
    }
    if (parts.length !== 2) return null;
    const [encodedData, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(encodedData).digest('base64url');
    if (signature !== expectedSig) return null;

    const data: TokenPayload = JSON.parse(Buffer.from(encodedData, 'base64url').toString('utf-8'));
    if (data.exp < Math.floor(Date.now() / 1000)) return null; // Expired
    return data;
  } catch {
    return null;
  }
}

// Generates an expiring one-time secure download access token for a customer and product
export function signDownloadToken(userId: string, productId: string, orderId: string, expiresInMinutes = 15): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
  const payload = { userId, productId, orderId, exp, type: 'pdf-access' };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyDownloadToken(token: string): { userId: string; productId: string; orderId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(encoded).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    if (payload.type !== 'pdf-access' || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { userId: payload.userId, productId: payload.productId, orderId: payload.orderId };
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }

  let user = db.getUserById(payload.userId);
  if (!user && payload.email) {
    user = db.getUserByEmail(payload.email);
  }
  if (!user && payload.userId) {
    user = db.addUser({
      id: payload.userId,
      name: payload.email ? payload.email.split('@')[0] : 'Customer',
      email: payload.email || `${payload.userId}@firebase.user`,
      phone: '',
      role: payload.role || (payload.email === 'mrityu7462@gmail.com' ? 'admin' : 'customer'),
      status: 'active',
      ordersCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      passwordHash: 'firebase_authenticated',
      salt: 'firebase'
    });
  }

  if (user && payload.email === 'mrityu7462@gmail.com' && user.role !== 'admin') {
    user.role = 'admin';
    db.updateUser(user.id, { role: 'admin' });
  }

  if (!user || user.status !== 'active') {
    res.status(403).json({ error: 'User account is not active or not found' });
    return;
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      let user = db.getUserById(payload.userId);
      if (!user && payload.email) {
        user = db.getUserByEmail(payload.email);
      }
      if (!user && payload.userId) {
        user = db.addUser({
          id: payload.userId,
          name: payload.email ? payload.email.split('@')[0] : 'Customer',
          email: payload.email || `${payload.userId}@firebase.user`,
          phone: '',
          role: payload.role || (payload.email === 'mrityu7462@gmail.com' ? 'admin' : 'customer'),
          status: 'active',
          ordersCount: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
          passwordHash: 'firebase_authenticated',
          salt: 'firebase'
        });
      }
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authenticateUser(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied: Admin privileges required' });
      return;
    }
    next();
  });
}
