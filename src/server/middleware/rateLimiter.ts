import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

// Simple in-memory rate limiter (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize
    requestCounts.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    logger.warn({
      message: 'Rate limit exceeded',
      clientId,
      count: clientData.count,
      resetTime: new Date(clientData.resetTime),
    });
    
    return res.status(429).json({
      error: {
        message: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      },
    });
  }
  
  clientData.count++;
  next();
};

