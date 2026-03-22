import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const RequestIdMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const traceId = crypto.randomUUID();
    req.headers['x-request-id'] = req.headers['x-request-id'] || traceId;
    next();
  };
};
