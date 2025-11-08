import express from 'express';
import { createServer } from 'http';

import path from 'path';
import { fileURLToPath } from 'url';
import { appRouter } from './routers';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createContext } from './_core/context';
import { initializeSocket } from './socket';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Socket.IO
initializeSocket(httpServer);

// Middleware
app.use(express.json());

// tRPC
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files from dist/public
const publicPath = path.join(__dirname, '..', 'dist', 'public');
app.use(express.static(publicPath));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`[Production Server] Running on http://localhost:${PORT}/`);
});
