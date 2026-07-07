import { Params } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import os from 'os';

export interface CreatePinoConfigOptions {
  appName: string;
  devMode: boolean;
  environment: string;
}

function shouldIgnoreHttpLog(req: IncomingMessage): boolean {
  const path = req.url?.split('?')[0] ?? '';
  return path === '/health' || path.endsWith('/health') || path.includes('/health-check');
}

export const createPinoConfig = (options: CreatePinoConfigOptions): Params => {
  const { appName, devMode, environment } = options;
  const isProduction = environment === 'production';

  return {
    pinoHttp: {
      name: appName.toUpperCase(),
      level: isProduction ? 'debug' : 'info',

      base: {
        pid: process.pid,
        hostname: os.hostname(),
        env: environment.toUpperCase(),
        service: appName.toUpperCase(),
      },

      genReqId: (req) => req.headers['x-request-id'] ?? randomUUID(),

      wrapSerializers: false,
      serializers: {
        req: (req: IncomingMessage) => ({
          requestId: req.headers['x-request-id'],
          method: req.method,
          url: req.url,
        }),
        res: (res: ServerResponse) => ({
          statusCode: res.statusCode,
        }),
      },

      transport: devMode
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
              ignore: 'pid,hostname',
            },
          }
        : undefined,

      autoLogging: {
        ignore: shouldIgnoreHttpLog,
      },

      customProps: () => ({}),
    },
  };
};
