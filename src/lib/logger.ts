export type LogLevel = "info" | "warn" | "error" | "debug"

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: Error
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug")

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`
  const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ""
  const error = entry.error ? ` ${entry.error.message}\n${entry.error.stack}` : ""
  return `${base}${context}${error}`
}

function createEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error,
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (shouldLog("debug")) {
      const entry = createEntry("debug", message, context)
      console.debug(formatLog(entry))
    }
  },

  info(message: string, context?: Record<string, unknown>) {
    if (shouldLog("info")) {
      const entry = createEntry("info", message, context)
      console.info(formatLog(entry))
    }
  },

  warn(message: string, context?: Record<string, unknown>) {
    if (shouldLog("warn")) {
      const entry = createEntry("warn", message, context)
      console.warn(formatLog(entry))
    }
  },

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    if (shouldLog("error")) {
      const entry = createEntry("error", message, context, error)
      console.error(formatLog(entry))
    }
  },

  loginAttempt(email: string, success: boolean) {
    this.info("Login attempt", { email, success })
  },

  saleCreated(saleNumber: string, total: number, cashierId: string) {
    this.info("Sale created", { saleNumber, total, cashierId })
  },

  inventoryUpdated(productId: string, transactionType: string, quantity: number) {
    this.info("Inventory updated", { productId, transactionType, quantity })
  },

  criticalError(error: Error, context?: Record<string, unknown>) {
    this.error("Critical system error", error, context)
  },
}
