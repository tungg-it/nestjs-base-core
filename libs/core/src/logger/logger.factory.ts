import { Params } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import os from 'os';
import { getHttpResponseData } from './http-response-data';
import { getHttpRequestData } from './http-request-data';

export interface CreatePinoConfigOptions {
  appName: string;
  devMode: boolean;
  environment: string;
  prettyAvailable?: boolean;
}

type HttpIncomingMessage = IncomingMessage & { originalUrl?: string };
type GrpcRequestLog = { requestId: string; method: string; url: string; body?: unknown };
type GrpcResponseLog = { grpcStatusCode: number };

export function serializeRequest(req: IncomingMessage | GrpcRequestLog, includeData = true) {
  if (!('headers' in req)) return req;
  const body = includeData ? getHttpRequestData(req) : undefined;
  return {
    requestId: req.headers['x-request-id'],
    method: req.method,
    url: requestUrl(req),
    ...(body === undefined ? {} : { body }),
  };
}

export function serializeResponse(res: ServerResponse | GrpcResponseLog, includeData = true) {
  if ('grpcStatusCode' in res) return res;
  const data = includeData ? getHttpResponseData(res) : undefined;
  return { statusCode: res.statusCode, ...(data === undefined ? {} : { data }) };
}

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

      quietReqLogger: true,
      wrapSerializers: false,
      serializers: {
        req: (req: IncomingMessage | GrpcRequestLog) => serializeRequest(req, !isProduction),
        res: (res: ServerResponse | GrpcResponseLog) => serializeResponse(res, !isProduction),
      },

      customSuccessObject: (req, _res, value: Record<string, unknown>) => ({
        ...value,
        req: serializeRequest(req, !isProduction),
      }),
      customErrorObject: (req, _res, _error, value: Record<string, unknown>) => ({
        ...value,
        req: serializeRequest(req, !isProduction),
      }),

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
