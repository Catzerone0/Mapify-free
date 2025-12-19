type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  workspaceId?: string;
  requestId?: string;
  [key: string]: unknown;
}

const SENSITIVE_FIELDS = [
  "password",
  "apiKey",
  "api_key",
  "encryptedKey",
  "encrypted_key",
  "token",
  "secret",
  "authorization",
  "cookie",
];

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return context;

    const sanitized: LogContext = {};
    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeContext(value as LogContext);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const sanitizedContext = this.sanitizeContext(context);
    const contextStr = sanitizedContext ? ` ${JSON.stringify(sanitizedContext)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(this.formatMessage("error", message, context));
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
}

export const logger = new Logger();
