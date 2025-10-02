import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

export interface ILogger {
  info(message: string, data?: Record<string, any>): void
  warn(message: string, data?: Record<string, any>): void
  error(message: string, data?: Record<string, any>): void
}

export class Logger implements ILogger {
  private logger: winston.Logger;
  private endpoint: string;
  private env: string;
  private awsRegion: string;

  constructor(endpoint: string, env?: string) {
    this.endpoint = endpoint;
    this.env = env || process.env.NODE_ENV || 'LOCAL';
    this.awsRegion = process.env.AWS_REGION || 'us-east-1';

    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    // Определяем название лог-группы
    const logGroupName = `gipiti-${this.env}`;

    // Создаем название лог-стрима с датой
    const today = new Date();
    const dateStr = today.toLocaleDateString('ru-RU').replace(/\./g, '-');
    const logStreamName = `${dateStr}-${this.endpoint}`;

    console.log(`[LOGGER] Creating logger for ${this.endpoint}`);
    console.log(`[LOGGER] Environment: ${this.env}`);
    console.log(`[LOGGER] Log group: ${logGroupName}`);
    console.log(`[LOGGER] Log stream: ${logStreamName}`);

    const cloudWatchTransport = new WinstonCloudWatch({
      name: 'cloudwatch-logs',
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      awsRegion: this.awsRegion,
      jsonMessage: true,
      level: 'info',
      errorHandler(err) {
        console.error('[LOGGER ERROR] Error sending logs to CloudWatch:', err);
      },
    });

    const consoleTransport = new winston.transports.Console({
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: 'HH:mm:ss'
        }),
        winston.format.printf(({ timestamp, level, message, endpoint, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${endpoint}: ${message} ${metaStr}`;
        })
      )
    });

    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'gipiti-server',
        endpoint: this.endpoint,
        environment: this.env
      },
      transports: [
        cloudWatchTransport,
        consoleTransport
      ],
      exceptionHandlers: [
        cloudWatchTransport,
        consoleTransport
      ],
      rejectionHandlers: [
        cloudWatchTransport,
        consoleTransport
      ]
    });

    return logger;
  }

  info(message: string, data?: Record<string, any>): void {
    this.logger.info(message, {
      endpoint: this.endpoint,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  warn(message: string, data?: Record<string, any>): void {
    this.logger.warn(message, {
      endpoint: this.endpoint,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  error(message: string, data?: Record<string, any>): void {
    this.logger.error(message, {
      endpoint: this.endpoint,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Метод для создания логгера для конкретного эндпоинта
  static forEndpoint(endpoint: string, env?: string): ILogger {
    return new Logger(endpoint, env);
  }
}

// Функция для обратной совместимости со старым кодом
export function createLoggerForEndpoint(endpoint: string): ILogger {
  return Logger.forEndpoint(endpoint);
}