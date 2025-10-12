import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error({
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } else {
    logger.warn({
      error: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(process.env['NODE_ENV'] === 'development' && {
        stack: error.stack,
        isOperational,
      }),
    },
  });
};

