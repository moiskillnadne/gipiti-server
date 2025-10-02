import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

export const logger = winston.createLogger({
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
    }),
    new WinstonCloudWatch({
      name: 'cloudwatch-logs',
      logGroupName: `gipiti-${process.env.NODE_ENV}`,
      logStreamName: `${new Date().toISOString().split('T')[0]}`,
      awsRegion: process.env.AWS_REGION!,
      awsOptions: {
        credentials: defaultProvider()
      },
      jsonMessage: true,
      level: 'info',
      errorHandler(err) {
        console.error(`[LOGGER ERROR] Error sending logs to CloudWatch: ${err.message}`);
        console.log(JSON.stringify(err))
      },
    })
  ]
});

