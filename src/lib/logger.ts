/**
 * 结构化日志工具
 * 提供类型安全的结构化日志记录，替代console语句
 * 遵循项目编码标准，支持不同日志级别和结构化数据
 */

/** 日志级别枚举 */
export enum LogLevel {
  // eslint-disable-next-line no-unused-vars
  DEBUG = 'debug',
  // eslint-disable-next-line no-unused-vars
  INFO = 'info',
  // eslint-disable-next-line no-unused-vars
  WARN = 'warn',
  // eslint-disable-next-line no-unused-vars
  ERROR = 'error',
}

/** 日志条目接口 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

/** 日志配置接口 */
export interface LoggerConfig {
  /** 是否启用日志 */
  enabled: boolean;
  /** 最小日志级别 */
  minLevel: LogLevel;
  /** 是否在开发环境输出到控制台 */
  enableConsoleInDev: boolean;
  /** 是否包含时间戳 */
  includeTimestamp: boolean;
}

/** 默认日志配置 */
const DEFAULT_CONFIG: LoggerConfig = {
  enabled: true,
  minLevel: LogLevel.INFO,
  enableConsoleInDev: process.env.NODE_ENV === 'development',
  includeTimestamp: true,
};

/** 日志级别优先级映射 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * 结构化日志记录器类
 */
class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 检查日志级别是否应该被记录
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // 安全的属性访问，避免对象注入
    const levelPriority =
      LOG_LEVEL_PRIORITY[level as keyof typeof LOG_LEVEL_PRIORITY];
    const minLevelPriority =
      LOG_LEVEL_PRIORITY[
        this.config.minLevel as keyof typeof LOG_LEVEL_PRIORITY
      ];

    return levelPriority >= minLevelPriority;
  }

  /**
   * 创建日志条目
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: this.config.includeTimestamp ? new Date().toISOString() : '',
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = error;
    }

    return entry;
  }

  /**
   * Console method mapping for different log levels
   */
  private readonly consoleMethodMap = {
    // eslint-disable-next-line no-console
    [LogLevel.DEBUG]: console.debug,
    // eslint-disable-next-line no-console
    [LogLevel.INFO]: console.info,
    [LogLevel.WARN]: console.warn,
    [LogLevel.ERROR]: console.error,
  } as const;

  /**
   * Format log message with timestamp
   */
  private formatLogMessage(message: string, timestamp?: string): string {
    const timePrefix = timestamp ? `[${timestamp}] ` : '';
    return `${timePrefix}${message}`;
  }

  /**
   * 输出日志到控制台 (仅在开发环境)
   */
  private outputToConsole(entry: LogEntry): void {
    if (!this.config.enableConsoleInDev) {
      return;
    }

    const { level, message, timestamp, context, error } = entry;
    const fullMessage = this.formatLogMessage(message, timestamp);
    const consoleMethod =
      this.consoleMethodMap[level as keyof typeof this.consoleMethodMap];

    if (consoleMethod) {
      consoleMethod(fullMessage, context || '', error || '');
    }
  }

  /**
   * 记录日志的通用方法
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, context, error);

    // 在开发环境输出到控制台
    this.outputToConsole(entry);

    // 在生产环境可以扩展为发送到日志服务
    // 例如：Sentry、CloudWatch、或其他日志聚合服务
  }

  /**
   * 记录调试信息
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * 记录一般信息
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * 记录警告信息
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * 记录错误信息
   */
  error(
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * 更新日志配置
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

/** 默认日志实例 */
export const logger = new Logger();

/** 创建自定义日志实例 */
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(config);
}

/** 日志工具函数 */
export const log = {
  debug: (message: string, context?: Record<string, unknown>) =>
    logger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    logger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    logger.warn(message, context),
  error: (message: string, context?: Record<string, unknown>, error?: Error) =>
    logger.error(message, context, error),
};

/** 导出类型 - 使用命名导出避免冲突 */
export type { LoggerConfig as LoggerConfiguration, LogEntry as LoggerEntry };
