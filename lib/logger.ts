type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = {
  userId?: string;
  workspaceId?: string;
  requestId?: string;
  [key: string]: unknown;
};

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
        continue;
      }

      if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeContext(value as LogContext);
        continue;
      }

      sanitized[key] = value;
    }
    return sanitized;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const sanitizedContext = this.sanitizeContext(context);
    const contextStr = sanitizedContext ? ` ${JSON.stringify(sanitizedContext)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private write(line: string, stream: "stdout" | "stderr") {
    if (typeof window !== "undefined") return;

    try {
      if (stream === "stderr") {
        process.stderr.write(line + "\n");
      } else {
        process.stdout.write(line + "\n");
      }
    } catch {
      // ignore
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.isDev) return;
    this.write(this.formatMessage("debug", message, context), "stdout");
  }

  info(message: string, context?: LogContext) {
    this.write(this.formatMessage("info", message, context), "stdout");
  }

  warn(message: string, context?: LogContext) {
    this.write(this.formatMessage("warn", message, context), "stderr");
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.write(this.formatMessage("error", message, context), "stderr");

    if (error instanceof Error && error.stack) {
      this.write(error.stack, "stderr");
    }
  }
}

export const logger = new Logger();
