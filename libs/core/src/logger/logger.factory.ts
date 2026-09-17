import { Params } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import os from 'os';

export interface CreatePinoConfigOptions {
  appName: string;
  devMode: boolean;
  environment: string;
  prettyAvailable?: boolean;
}

type HttpIncomingMessage = IncomingMessage & { originalUrl?: string };

export function canResolvePinoPretty(resolve: (id: string) => string = require.resolve): boolean {
  try {
    resolve('pino-pretty');
    return true;
  } catch {
    return false;
  }
}

function requestUrl(req: IncomingMessage): string {
  const httpReq = req as HttpIncomingMessage;
  return httpReq.originalUrl ?? httpReq.url ?? '';
}

function shouldIgnoreHttpLog(req: IncomingMessage): boolean {
  const path = requestUrl(req).split('?')[0] ?? '';
  return path === '/health' || path.endsWith('/health') || path.includes('/health-check');
}

export const createPinoConfig = (options: CreatePinoConfigOptions): Params => {
  const { appName, devMode, environment } = options;
  const isProduction = environment === 'production';
  const usePretty = devMode && (options.prettyAvailable ?? canResolvePinoPretty());

  return {
    pinoHttp: {
      name: appName.toUpperCase(),
      level: isProduction ? 'info' : 'debug',

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
          url: requestUrl(req),
        }),
        res: (res: ServerResponse) => ({
          statusCode: res.statusCode,
        }),
      },

      transport: usePretty
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
