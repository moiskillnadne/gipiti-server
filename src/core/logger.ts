// logger.ts
import pino from 'pino';

export function createLoggerForEndpoint(endpoint: string) {
  const todayDate = new Date().toISOString().split('T')[0];
  const logStreamName = `${endpoint}-${todayDate}`;

  const logger = pino({
    level: 'info',
    transport: {
      targets: [
        {
          target: '@serdnam/pino-cloudwatch-transport',
          options: {
              logGroupName: `gipiti-${process.env.NODE_ENV}`,
              logStreamName: logStreamName,
              awsRegion: process.env.AWS_REGION,
          }
        },
        {
          target: 'pino-pretty',
          options: {
            colorize: true,
          }
        }
      ]
    }
  });

  return logger
}
