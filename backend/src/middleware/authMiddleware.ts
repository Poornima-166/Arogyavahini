import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'patient' | 'driver' | 'admin';
  };
}

export function mockAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // If user info is passed via headers or auth token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In production, verify JWT token here
    // For development, provide context
  }
  next();
}

export function requireRole(allowedRoles: Array<'patient' | 'driver' | 'admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = (req.headers['x-user-role'] as any) || req.user?.role;
    if (userRole && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: { message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}` },
      });
    }
    next();
  };
}
