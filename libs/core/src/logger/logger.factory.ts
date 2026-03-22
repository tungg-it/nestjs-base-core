import { Params } from 'nestjs-pino';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import os from 'os';

export interface CreatePinoConfigOptions {
  appName: string;
  devMode: boolean;
  environment: string;
}

export const createPinoConfig = (options: CreatePinoConfigOptions): Params => {
  const { appName, devMode, environment } = options;
  const isProduction = environment === 'production';

  return {
    pinoHttp: {
      // Service name
      name: appName.toUpperCase(),
      // Log level
      level: isProduction ? 'debug' : 'info',
      // Default pino base is { pid, hostname }; merge so we keep those + env
      base: {
        pid: process.pid,
        hostname: os.hostname(),
        env: environment.toUpperCase(),
        service: appName.toUpperCase(),
      },

      // Generate request ID
      genReqId: (req) => req.headers['x-request-id'] ?? randomUUID(),

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

      // Serializers for request and response
      serializers: {
        req(req: Request) {
          return {
            requestId: req.headers['x-request-id'],
            method: req.method,
            url: req.url,
            body: isProduction ? {} : req.body,
          };
        },
        res(res: Response) {
          return {
            statusCode: res.statusCode,
            body: isProduction ? {} : res.locals?.responseBody,
          };
        },
      },

      // Auto logging for health check
      autoLogging: {
        ignore: (req) => req.url.includes('/health-check'),
      },
    },
  };
};
