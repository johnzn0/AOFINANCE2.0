import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../db/users';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    [key: string]: any;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Verify Cloud SQL token
  const customUser = verifyToken(token);
  if (customUser) {
    req.user = {
      uid: customUser.uid,
      email: customUser.email,
    };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
};

