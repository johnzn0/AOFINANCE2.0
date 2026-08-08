export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
  userEmail?: string;
  url?: string;
}

const STORAGE_KEY = 'sys_monitoring_logs';
const MAX_LOGS = 150;

class LoggerService {
  private logs: LogEntry[] = [];
  private sentryDsn: string | null = null;
  private isCloudLoggingEnabled = true;

  constructor() {
    this.sentryDsn = (import.meta as any).env?.VITE_SENTRY_DSN || null;
    this.loadLogsFromStorage();
    
    // Catch unhandled window errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Unhandled Global Error', event.error || event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', event.reason, {
          reason: String(event.reason),
        });
      });
    }
  }

  private loadLogsFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.logs = JSON.parse(raw);
        }
      }
    } catch {
      this.logs = [];
    }
  }

  private saveLogsToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(-MAX_LOGS)));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private addEntry(level: LogLevel, message: string, errorObj?: any, context?: Record<string, any>) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: errorObj?.stack || (errorObj instanceof Error ? errorObj.stack : undefined),
      url: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    // Console output for dev environment
    const consoleMsg = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`;
    if (level === 'error') {
      console.error(consoleMsg, errorObj || '', context || '');
    } else if (level === 'warn') {
      console.warn(consoleMsg, context || '');
    } else if (level === 'debug') {
      console.debug(consoleMsg, context || '');
    } else {
      console.log(consoleMsg, context || '');
    }

    // Add to buffer
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }
    this.saveLogsToStorage();

    // Sentry / Cloud Logging simulation or integration
    this.dispatchToExternalMonitoring(entry, errorObj);

    return entry;
  }

  private dispatchToExternalMonitoring(entry: LogEntry, errorObj?: any) {
    // Sentry Browser SDK integration if available on window
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        if (entry.level === 'error') {
          (window as any).Sentry.captureException(errorObj || new Error(entry.message), {
            extra: entry.context,
          });
        } else {
          (window as any).Sentry.captureMessage(entry.message, entry.level);
        }
      } catch {
        // Ignore Sentry dispatch failure
      }
    }

    // Server-side / Cloud logging fallback call
    if (this.isCloudLoggingEnabled && typeof fetch !== 'undefined') {
      // Send asynchronously without blocking
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Endpoint might be optional or mock, suppress error
      });
    }
  }

  public info(message: string, context?: Record<string, any>) {
    return this.addEntry('info', message, undefined, context);
  }

  public warn(message: string, context?: Record<string, any>) {
    return this.addEntry('warn', message, undefined, context);
  }

  public error(message: string, errorObj?: any, context?: Record<string, any>) {
    return this.addEntry('error', message, errorObj, context);
  }

  public debug(message: string, context?: Record<string, any>) {
    return this.addEntry('debug', message, undefined, context);
  }

  public trackEvent(eventName: string, properties?: Record<string, any>) {
    return this.info(`Event: ${eventName}`, { eventName, ...properties });
  }

  public getLogs(): LogEntry[] {
    return [...this.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public clearLogs() {
    this.logs = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  public exportLogsJson(): string {
    return JSON.stringify(this.getLogs(), null, 2);
  }

  public getSentryStatus(): { configured: boolean; dsn: string | null } {
    return {
      configured: Boolean(this.sentryDsn || (typeof window !== 'undefined' && (window as any).Sentry)),
      dsn: this.sentryDsn,
    };
  }
}

export const logger = new LoggerService();
