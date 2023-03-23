import path from "path";
import stripAnsi from "strip-ansi";
import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

export const LOG_DIR = "log";
export const PROJECT = "lince-discord-bot";

// Create a logger with winston
const logger = createLogger({
  defaultMeta: { service: PROJECT },
  format: format.combine(format.metadata(), format.timestamp()),
  transports: [
    new transports.DailyRotateFile({
      // without colors
      format: format.combine(
        format.label({ label: path.basename(PROJECT) }),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        format.printf(
          (info) =>
            `${info.timestamp} ${info.level} [${info.label}]: ${stripAnsi(
              info.message
            )}`
        )
      ),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "5m",
      maxFiles: 30,
      level: "debug",
      filename: `${LOG_DIR}/${PROJECT}-%DATE%.log`,
    }),
    new transports.Console({
      // colorized
      format: format.combine(
        format.colorize(),
        format.label({ label: path.basename(PROJECT) }),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        format.printf(
          (info) =>
            `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
        )
      ),
      level: "info",
    }),
  ],
});

// Export the logger
export default logger;
