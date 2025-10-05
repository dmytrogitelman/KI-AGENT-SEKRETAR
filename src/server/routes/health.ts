import { Router } from 'express';
import { prisma } from '../../db/prismaClient';
import { logger } from '../../utils/logger';

const router = Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Detailed health check with dependencies
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    dependencies: {
      database: 'unknown',
      redis: 'unknown',
      openai: 'unknown',
      twilio: 'unknown',
    },
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    health.dependencies.database = 'healthy';
  } catch (error) {
    health.dependencies.database = 'unhealthy';
    health.status = 'degraded';
    logger.error('Database health check failed', { error });
  }

  // TODO: Add Redis health check
  // TODO: Add OpenAI health check
  // TODO: Add Twilio health check

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are available
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;

