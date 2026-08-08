import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './server/routes/auth';
import aiRoutes from './server/routes/ai';

const app = express();
const PORT = 3000;

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Limite de requisições excedido.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/ai', apiLimiter, aiRoutes);

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  import('vite').then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then((vite) => {
      app.use(vite.middlewares);
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
      });
    });
  });
} else if (!process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
