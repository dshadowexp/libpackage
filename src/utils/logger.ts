import winston, { Logger } from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export const winstonLogger = (elasticsearchNode: string, name: string, level: string): Logger => {
    const options = {
      console: {
        level,
        handleExceptions: true,
        json: false,
        colorize: true
      },
      elasticsearch: {
        level,
        apm: false,
        clientOpts: {
          node: elasticsearchNode,
          log: level,
          maxRetries: 2,
          requestTimeout: 10000,
          sniffOnStart: false
        }
      }
    };

  const logger: Logger = winston.createLogger({
    exitOnError: false,
    defaultMeta: { service: name },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console(options.console),
      new ElasticsearchTransport(options.elasticsearch)
    ]
  });

  logger.on('error', (error) => {
    console.error('Error in logger caught', error);
  });
  
  return logger;
}