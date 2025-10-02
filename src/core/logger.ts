import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

export interface ILogger {
  info(message: string, data?: Record<string, any>): void
  warn(message: string, data?: Record<string, any>): void
  error(message: string, data?: Record<string, any>): void
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
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
    })
  ]
});

export class Logger implements ILogger {
  private endpoint: string;
  private env: string;
  private awsRegion: string;

  constructor(endpoint: string, env?: string) {
    this.endpoint = endpoint;
    this.env = env || process.env.NODE_ENV || 'LOCAL';
    this.awsRegion = process.env.AWS_REGION || 'eu-central-1';

    this.applyWinstonTransports();
  }

  private applyWinstonTransports(): void{
    const logGroupName = `gipiti-${this.env}`;

    const today = new Date();
    const dateStr = today.toLocaleDateString('ru-RU').replace(/\./g, '-');
    const logStreamName = `${dateStr}-${this.endpoint}`;

    console.log(`[LOGGER] Environment: ${this.env}`);
    console.log(`[LOGGER] Log group: ${logGroupName}`);

    const cloudWatchTransport = new WinstonCloudWatch({
      name: 'cloudwatch-logs',
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      awsRegion: this.awsRegion,
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY!,
      jsonMessage: true,
      level: 'info',
      errorHandler(err) {
        console.error('[LOGGER ERROR] Error sending logs to CloudWatch:', err);
      },
    });

    logger.add(cloudWatchTransport)
  }

  info(message: string, data?: Record<string, any>): void {
    logger.info(message, {
      endpoint: this.endpoint,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  warn(message: string, data?: Record<string, any>): void {
    logger.warn(message, {
      endpoint: this.endpoint,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  error(message: string, data?: Record<string, any>): void {
    logger.error(message, {
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