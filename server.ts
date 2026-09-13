import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api-router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Serve public uploads (e.g. thumbnails)
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  // Mount API Router
  app.use('/api', apiRouter);

  // Catch-all for API routes to guarantee JSON errors (never fall through to SPA HTML)
  app.use((req, res, next) => {
    const isApiRequest =
      req.path === '/api' ||
      req.path.startsWith('/api/') ||
      req.originalUrl.startsWith('/api') ||
      (req.headers.accept && req.headers.accept.includes('application/json') && !req.path.startsWith('/@') && !req.path.startsWith('/src'));

    if (isApiRequest) {
      return res.status(404).json({
        error: `API endpoint not found: ${req.method} ${req.originalUrl}`
      });
    }
    next();
  });

  // Global Express error handler for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    const isApiRequest =
      req.path.startsWith('/api') ||
      req.originalUrl.startsWith('/api') ||
      (req.headers.accept && req.headers.accept.includes('application/json'));

    if (isApiRequest) {
      console.error(`[API ERROR] ${req.method} ${req.originalUrl}:`, err);
      return res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
      });
    }
    next(err);
  });

  // Vite middleware in development; Static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NotesVidya server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
