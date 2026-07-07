import { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

/**
 * Platform-neutral middleware: on Fastify this runs via `@fastify/middie` with raw Node
 * request/response objects, not Express types.
 */
export const RequestIdMiddleware = () => {
  return (req: IncomingMessage, _res: ServerResponse, next: (err?: unknown) => void) => {
    const traceId = crypto.randomUUID();
    req.headers['x-request-id'] = req.headers['x-request-id'] || traceId;
    next();
  };
};
