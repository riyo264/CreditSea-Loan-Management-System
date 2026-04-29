import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Role } from '../models/Users';

/**
 * Middleware to check user roles before hitting the controller.
 * 
 * Pass in the roles allowed to access the route.
 * e.g., router.get('/dashboard', authorize('admin', 'sales'), myController)
 * 
 * We throw a 403 Forbidden if they don't have the right permissions
 * so the frontend knows exactly why the request failed.
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access forbidden. Required role(s): [${allowedRoles.join(', ')}]. Your role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
};