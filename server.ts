import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getUserProfileByUid,
  getUserStateByUid,
  saveUserStateByUid,
  getAllUsers,
  updateUserProfile,
  registerUserWithEmail,
  loginUserWithEmail,
  resetUserPasswordWithEmail,
  generateToken,
} from './src/db/users.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'cloudsql' });
  });

  // Register with Email & Password directly in Cloud SQL
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      }
      const dbUser = await registerUserWithEmail(email, password, name);
      const token = generateToken(dbUser.uid, dbUser.email);
      return res.json({
        token,
        profile: {
          uid: dbUser.uid,
          email: dbUser.email,
          displayName: dbUser.displayName || '',
          role: dbUser.role,
          status: dbUser.status,
          plan: dbUser.plan,
          createdAt: dbUser.createdAt,
          lastLoginAt: dbUser.lastLoginAt,
        },
      });
    } catch (err: any) {
      console.error('Error in /api/auth/register:', err);
      res.status(400).json({ error: err.message || 'Falha ao registrar usuário.' });
    }
  });

  // Login with Email & Password directly in Cloud SQL
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      }
      const dbUser = await loginUserWithEmail(email, password);
      const token = generateToken(dbUser.uid, dbUser.email);
      return res.json({
        token,
        profile: {
          uid: dbUser.uid,
          email: dbUser.email,
          displayName: dbUser.displayName || '',
          role: dbUser.role,
          status: dbUser.status,
          plan: dbUser.plan,
          createdAt: dbUser.createdAt,
          lastLoginAt: dbUser.lastLoginAt,
        },
      });
    } catch (err: any) {
      console.error('Error in /api/auth/login:', err);
      res.status(400).json({ error: err.message || 'Falha ao realizar login.' });
    }
  });

  // Reset password directly in Cloud SQL
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'O e-mail é obrigatório.' });
      }
      const result = await resetUserPasswordWithEmail(email, newPassword);
      return res.json(result);
    } catch (err: any) {
      console.error('Error in /api/auth/reset-password:', err);
      res.status(400).json({ error: err.message || 'Falha ao redefinir a senha.' });
    }
  });

  // Get current user profile
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
      let profile = await getUserProfileByUid(req.user.uid);
      if (!profile && req.user.email) {
        profile = await getOrCreateUser(
          req.user.uid,
          req.user.email,
          req.user.name || (req.user as any).displayName || '',
          req.user.picture || ''
        );
      }
      if (!profile) return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
      return res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch current profile' });
    }
  });

  // Sync Auth user with Cloud SQL
  app.post('/api/auth/sync', async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || req.body?.uid;
      const email = req.user?.email || req.body?.email;
      const displayName = req.user?.name || (req.user as any)?.displayName || req.body?.displayName || '';
      const photoURL = req.user?.picture || req.body?.photoURL || '';

      if (!uid || !email) {
        return res.status(400).json({ error: 'Missing user credentials' });
      }

      const dbUser = await getOrCreateUser(
        uid,
        email,
        displayName,
        photoURL
      );

      return res.json({
        uid: dbUser.uid,
        email: dbUser.email,
        displayName: dbUser.displayName || '',
        photoURL: dbUser.photoURL || '',
        role: dbUser.role,
        status: dbUser.status,
        plan: dbUser.plan,
        createdAt: dbUser.createdAt,
        lastLoginAt: dbUser.lastLoginAt,
      });
    } catch (err: any) {
      console.error('Error in /api/auth/sync:', err);
      res.status(500).json({ error: err.message || 'Failed to sync user' });
    }
  });

  // Get user financial app state from Cloud SQL
  app.get('/api/user/state', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const state = await getUserStateByUid(req.user.uid);
      return res.json({ state });
    } catch (err: any) {
      console.error('Error in /api/user/state:', err);
      res.status(500).json({ error: err.message || 'Failed to get user state' });
    }
  });

  // Save user financial app state to Cloud SQL
  app.post('/api/user/state', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { state } = req.body;
      if (!state) {
        return res.status(400).json({ error: 'Missing state body' });
      }
      await saveUserStateByUid(req.user.uid, state);
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Error saving /api/user/state:', err);
      res.status(500).json({ error: err.message || 'Failed to save user state' });
    }
  });

  // Admin routes
  app.get('/api/admin/users', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
      const currentProfile = await getUserProfileByUid(req.user.uid);
      if (currentProfile?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const allUsersList = await getAllUsers();
      res.json(allUsersList);
    } catch (err: any) {
      console.error('Error in /api/admin/users:', err);
      res.status(500).json({ error: err.message || 'Failed to list users' });
    }
  });

  app.patch('/api/admin/users/:targetUid', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
      const currentProfile = await getUserProfileByUid(req.user.uid);
      if (currentProfile?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const { targetUid } = req.params;
      const updated = await updateUserProfile(targetUid, req.body);
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating user:', err);
      res.status(500).json({ error: err.message || 'Failed to update user' });
    }
  });

  // Vite middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
