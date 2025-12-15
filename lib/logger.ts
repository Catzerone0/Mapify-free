type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  workspaceId?: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
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
