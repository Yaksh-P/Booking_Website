import fs from "fs";
import path from "path";

type LogLevel = "info" | "warn" | "error";

function getLogDirectory() {
  return path.resolve(process.env.LOG_DIRECTORY ?? "logs");
}

function writeLog(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  const logDirectory = getLogDirectory();
  fs.mkdirSync(logDirectory, { recursive: true });

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(metadata ?? {}),
  };

  const serialized = `${JSON.stringify(entry)}\n`;

  fs.appendFileSync(path.join(logDirectory, "application.log"), serialized, "utf-8");

  if (level === "error") {
    fs.appendFileSync(path.join(logDirectory, "errors.log"), serialized, "utf-8");
  }

  if (process.env.NODE_ENV !== "test") {
    const loggerMethod =
      level === "error" ? console.error : level === "warn" ? console.warn : console.info;
    loggerMethod(`[${level.toUpperCase()}] ${message}`);
  }
}

export const logger = {
  info(message: string, metadata?: Record<string, unknown>) {
    writeLog("info", message, metadata);
  },
  warn(message: string, metadata?: Record<string, unknown>) {
    writeLog("warn", message, metadata);
  },
  error(message: string, metadata?: Record<string, unknown>) {
    writeLog("error", message, metadata);
  },
};
