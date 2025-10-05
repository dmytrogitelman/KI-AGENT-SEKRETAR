// src/app.ts
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { setupRoutes } from './server/routes';
import { requestLogger } from './server/middleware/requestLogger';
import { rateLimiter } from './server/middleware/rateLimiter';
import { errorHandler } from './server/middleware/errorHandler';

const app = express();

// security
app.use(helmet());
// parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// tmp/media
const mediaDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
app.use('/media', express.static(mediaDir));

// logs/limits
app.use(requestLogger);
app.use(rateLimiter);

// routes
setupRoutes(app);

// errors
app.use(errorHandler);

export default app;
