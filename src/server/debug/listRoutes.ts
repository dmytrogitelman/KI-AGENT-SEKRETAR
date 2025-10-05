import type { Express } from 'express';

export function listRoutes(app: Express) {
  const routes: string[] = [];
  // @ts-ignore - internal structure
  app._router?.stack?.forEach((m: any) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).join(',').toUpperCase();
      routes.push(`${methods} ${m.route.path}`);
    } else if (m.name === 'router' && m.handle?.stack) {
      m.handle.stack.forEach((h: any) => {
        const route = h.route;
        if (route) {
          const methods = Object.keys(route.methods).join(',').toUpperCase();
          routes.push(`${methods} ${route.path}`);
        }
      });
    }
  });
  console.log('[ROUTES]', routes);
}
