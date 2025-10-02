// logger.ts
import pino from 'pino';

export function createLoggerForEndpoint(endpoint: string) {
  const todayDate = new Date().toISOString().split('T')[0];
  const logStreamName = `${endpoint}-${todayDate}`;
  const awsRegion = process.env.AWS_REGION;

  console.log(`[LOGGER] Node environment: ${process.env.NODE_ENV}`);
  console.log(`[LOGGER] AWS region: ${awsRegion}`);
  console.log(`[LOGGER] Creating logger for endpoint: ${endpoint}`);
  console.log(`[LOGGER] Log stream name: ${logStreamName}`);


  const logger = pino({
    level: 'info',
    transport: {
      targets: [
        {
          target: '@serdnam/pino-cloudwatch-transport',
          options: {
              logGroupName: `gipiti-${process.env.NODE_ENV}`,
              logStreamName: logStreamName,
              awsRegion: awsRegion,
              createLogGroup: true,
              createLogStream: true,
              uploadInterval: 30000,
              onError: (error: any) => {
                console.error('[LOGGER ERROR] Error sending logs to CloudWatch:', JSON.stringify(error));
              }
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

  logger.info(`[LOGGER] Logger created for endpoint: ${endpoint}`);

  return logger
}
