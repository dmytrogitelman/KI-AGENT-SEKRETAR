import type { Express } from 'express';
import whatsappRouter from './whatsapp.webhook';
import oauthRoutes from './oauth';
import healthRoutes from './health';

export function setupRoutes(app: Express) {
  // Важно: этот роутер регистрирует GET/POST /webhook/whatsapp
  app.use('/', whatsappRouter);

  // OAuth (Google, Microsoft, Zoom и т.д.)
  app.use('/oauth', oauthRoutes);

  // Health check
  app.use('/health', healthRoutes);

  // Простой health (если нет своего)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
  });

  // Простой / (чтобы не видеть "Cannot GET /")
  app.get('/', (_req, res) => {
    res.type('html').send(`
      <h1>WhatsApp AI Secretary</h1>
      <ul>
        <li><a href="/health">/health</a></li>
        <li>POST /webhook/whatsapp</li>
      </ul>
    `);
  });

  // Доп. API (пример)
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });
}
