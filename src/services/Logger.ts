import * as FileSystem from "expo-file-system/legacy";

const LOG_FILE_NAME = "pulsebox_logs.txt";
const MAX_LOG_SIZE = 1024 * 1024; // 1MB max per log file
const MAX_LOG_FILES = 3; // Keep up to 3 rotated log files

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
}

class LoggerService {
  private logFileUri: string;
  private isWriting: boolean = false;
  private writeQueue: LogEntry[] = [];
  private isEnabled: boolean = __DEV__ || true; // Always enabled in standalone for debugging

  constructor() {
    const documentsDir = FileSystem.documentDirectory || "";
    this.logFileUri = `${documentsDir}${LOG_FILE_NAME}`;
  }

  /**
   * Get formatted timestamp
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace("T", " ").substring(0, 19);
  }

  /**
   * Write log entry to file (async queue)
   */
  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.isEnabled) return;

    this.writeQueue.push(entry);

    // Process queue if not already writing
    if (!this.isWriting) {
      await this.processQueue();
    }
  }

  /**
   * Process write queue
   */
  private async processQueue(): Promise<void> {
    this.isWriting = true;

    try {
      while (this.writeQueue.length > 0) {
        const entry = this.writeQueue.shift();
        if (!entry) continue;

        const logLine = JSON.stringify(entry) + "\n";

        try {
          // Check if file exists and its size
          const fileInfo = await FileSystem.getInfoAsync(this.logFileUri);
          const needsRotation = fileInfo.exists && fileInfo.size > MAX_LOG_SIZE;

          if (needsRotation) {
            await this.rotateLogs();
          }

          // Append to file - read existing content and append new log
          try {
            const existing = await FileSystem.readAsStringAsync(
              this.logFileUri,
            );
            await FileSystem.writeAsStringAsync(
              this.logFileUri,
              existing + logLine,
            );
          } catch {
            // File doesn't exist yet, create it
            await FileSystem.writeAsStringAsync(this.logFileUri, logLine);
          }
        } catch (error) {
          console.warn("Failed to write log file:", error);
        }
      }
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Rotate log files (keep last N logs)
   */
  private async rotateLogs(): Promise<void> {
    const documentsDir = FileSystem.documentDirectory || "";

    // Shift existing logs: logs_2.txt → logs_3.txt, logs_1.txt → logs_2.txt, etc.
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const oldName = i === 1 ? LOG_FILE_NAME : `pulsebox_logs_${i}.txt`;
      const newName = `pulsebox_logs_${i + 1}.txt`;

      try {
        await FileSystem.moveAsync({
          from: `${documentsDir}${oldName}`,
          to: `${documentsDir}${newName}`,
        });
      } catch {
        // Ignore errors - file may not exist
      }
    }

    // Rename current log to logs_1.txt and start fresh
    try {
      await FileSystem.moveAsync({
        from: this.logFileUri,
        to: `${documentsDir}pulsebox_logs_1.txt`,
      });
    } catch {
      // Ignore if current log doesn't exist
    }
  }

  /**
   * Log a message
   */
  public async log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      metadata,
    };

    // Always log to console in development
    if (__DEV__) {
      const prefix = `[${level}]`;
      console.log(
        `%c${prefix}`,
        `color: ${this.getColorForLevel(level)}`,
        message,
        metadata || "",
      );
    }

    // Write to file
    await this.writeLog(entry);
  }

  /**
   * Log debug message
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    this.log("DEBUG", message, metadata);
  }

  /**
   * Log info message
   */
  public info(message: string, metadata?: Record<string, any>): void {
    this.log("INFO", message, metadata);
  }

  /**
   * Log warning message
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    this.log("WARN", message, metadata);
  }

  /**
   * Log error message
   */
  public error(
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
  ): void {
    const combinedMetadata = error
      ? { error: error.message, stack: error.stack, ...metadata }
      : metadata;
    this.log("ERROR", message, combinedMetadata);
  }

  /**
   * Get color for log level (for console)
   */
  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case "DEBUG":
        return "#888888";
      case "INFO":
        return "#007AFF";
      case "WARN":
        return "#FF9500";
      case "ERROR":
        return "#FF3B30";
      default:
        return "#000000";
    }
  }

  /**
   * Get log file URI (for sharing/access)
   */
  public getLogFilePath(): string {
    return this.logFileUri;
  }

  /**
   * Clear all logs
   */
  public async clearLogs(): Promise<void> {
    this.writeQueue = [];
    try {
      await FileSystem.deleteAsync(this.logFileUri, { idempotent: true });
    } catch (error) {
      console.warn("Failed to clear logs:", error);
    }
  }

  /**
   * Get logs as string (for debugging or sharing)
   */
  public async getLogs(): Promise<string> {
    try {
      return await FileSystem.readAsStringAsync(this.logFileUri);
    } catch (error: any) {
      if (error?.code === "FileNotFound") {
        return "No logs available";
      }
      return `Error reading logs: ${error?.message || "Unknown error"}`;
    }
  }
}

// Create singleton instance
export const logger = new LoggerService();

// Export types and class
export { LogEntry, LoggerService };

