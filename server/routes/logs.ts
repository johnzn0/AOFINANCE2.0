import { Router } from 'express';

const router = Router();

// In-memory server logs buffer
const serverLogsBuffer: any[] = [];
const MAX_SERVER_LOGS = 200;

router.post('/', (req, res) => {
  const log = req.body;
  if (!log || typeof log !== 'object') {
    return res.status(400).json({ error: 'Invalid log payload' });
  }

  const logEntry = {
    ...log,
    receivedAt: new Date().toISOString(),
    ip: req.ip || req.headers['x-forwarded-for'],
  };

  serverLogsBuffer.push(logEntry);
  if (serverLogsBuffer.length > MAX_SERVER_LOGS) {
    serverLogsBuffer.shift();
  }

  // Output to standard Cloud Logging console
  const prefix = `[CLOUD LOGGING] [${(log.level || 'info').toUpperCase()}]`;
  if (log.level === 'error') {
    console.error(prefix, log.message, log.stack || '', log.context || '');
  } else if (log.level === 'warn') {
    console.warn(prefix, log.message, log.context || '');
  } else {
    console.log(prefix, log.message, log.context || '');
  }

  res.json({ status: 'ok', loggedAt: logEntry.receivedAt });
});

router.get('/', (req, res) => {
  res.json({
    logs: serverLogsBuffer.slice().reverse(),
    total: serverLogsBuffer.length,
    sentryConfigured: Boolean(process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN),
  });
});

export default router;
