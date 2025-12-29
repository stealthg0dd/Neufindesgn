import { Request, Response, NextFunction } from 'express';
import { verifyUserToken } from '../config/supabase';
import { User } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
      return;
    }

    const supabaseUser = await verifyUserToken(token);
    
    req.user = {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.name,
      avatar: supabaseUser.user_metadata?.avatar_url,
      provider: (supabaseUser.app_metadata?.provider as 'google' | 'email') || 'google',
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
}

export function optionalAuthentication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  verifyUserToken(token)
    .then(supabaseUser => {
      req.user = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.name,
        avatar: supabaseUser.user_metadata?.avatar_url,
        provider: (supabaseUser.app_metadata?.provider as 'google' | 'email') || 'google',
        createdAt: new Date(supabaseUser.created_at),
        updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
      };
      next();
    })
    .catch(() => {
      next();
    });
}
