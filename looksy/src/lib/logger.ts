type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel;
  private context: LogContext;

  constructor(level: LogLevel = "info", context: LogContext = {}) {
    this.level = level;
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...this.context,
      ...(data ? { data } : {}),
    });
  }

  debug(message: string, data?: unknown) {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, data));
    }
  }

  info(message: string, data?: unknown) {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, data));
    }
  }

  warn(message: string, data?: unknown) {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, data));
    }
  }

  error(message: string, error?: unknown) {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, error));
    }
  }

  child(context: LogContext): Logger {
    return new Logger(this.level, { ...this.context, ...context });
  }
}

export function createLogger(context?: LogContext): Logger {
  const level = (process.env.LOG_LEVEL as LogLevel) || "info";
  return new Logger(level, context);
}

export const logger = createLogger();
