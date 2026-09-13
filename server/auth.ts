import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { User } from '../src/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'digital-pdf-store-secure-token-secret-key-2025';

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

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
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

  const user = db.getUserById(payload.userId);
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
      const user = db.getUserById(payload.userId);
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
