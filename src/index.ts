import express from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { config } from './utils/env';
import { logger } from './utils/logger';
import { setupRoutes } from './server/routes';
import { errorHandler } from './server/middleware/errorHandler';
import { requestLogger } from './server/middleware/requestLogger';
import { rateLimiter } from './server/middleware/rateLimiter';

const app = express();
// const PORT = config.PORT; // Commented out due to conflict

// Security middleware
app.use(helmet());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Папка для временных медиа
const mediaDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
app.use('/media', express.static(mediaDir));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Routes
setupRoutes(app);

import { listRoutes } from './server/debug/listRoutes';
// ...
setupRoutes(app);
listRoutes(app); // ← печатает все зарегистрированные пути на старте


// Error handling
app.use(errorHandler);

// Health checks
app.get(['/health', '/healthz'], (_, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
const PORT = Number(process.env['PORT'] || 3000);
app.listen(PORT, () => {
  logger.info(`🚀 WhatsApp AI Secretary Server running on port ${PORT}`);
  logger.info(`📱 Environment: ${config.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

