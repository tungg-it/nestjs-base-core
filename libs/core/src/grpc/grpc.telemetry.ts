import { randomUUID } from 'node:crypto';
import { toJson, type Message } from '@bufbuild/protobuf';
import { Code, type Interceptor } from '@connectrpc/connect';
import { context, metrics, propagation, SpanStatusCode, trace } from '@opentelemetry/api';
import { AppLogger } from '../logger/logger.service';
import { mapRpcError } from './grpc.errors';
import { maskSensitiveFields } from '@libs/util';

const tracer = trace.getTracer('doit.grpc');
const meter = metrics.getMeter('doit.grpc');
const calls = meter.createCounter('rpc.server.calls');
const duration = meter.createHistogram('rpc.server.duration', { unit: 'ms' });

interface GrpcServerInterceptorOptions {
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

export function createGrpcServerInterceptor(
  logger?: AppLogger,
  options: GrpcServerInterceptorOptions = {},
): Interceptor {
  return (next) => async (request) => {
    const started = performance.now();
    const service = request.service.typeName;
    const method = request.method.name;
    const requestId = safeRequestId(request.header.get('x-request-id'));
    let body: unknown;
    if (options.includeRequestBody && request.stream === false) {
      body = maskSensitiveFields(toJson(request.method.input, request.message));
    }
    request.header.set('x-request-id', requestId);
    const parent = propagation.extract(context.active(), request.header, {
      get: (carrier, key) => carrier.get(key) ?? undefined,
      keys: (carrier) => [...carrier.keys()],
    });
    return context.with(parent, () =>
      tracer.startActiveSpan(`${service}/${method}`, async (span) => {
        let code: number = Code.Unknown;
        let finished = false;
        let responseIsStream = false;
        let responseBody: unknown;
        try {
          const response = await next(request);
          if (response.stream) {
            responseIsStream = true;
            const stream = response.message;
            const monitored = (async function* () {
              try {
                for await (const item of stream) yield item;
                code = 0;
              } catch (error) {
                const mapped = mapRpcError(error);
                code = mapped.code;
                span.setStatus({ code: SpanStatusCode.ERROR });
                throw mapped;
              } finally {
                finish();
              }
            })();
            return { ...response, message: monitored };
          }
          code = 0;
          if (options.includeResponseBody) {
            responseBody = maskSensitiveFields(toJson(request.method.output, response.message as Message));
          }
          return response;
        } catch (error) {
          const mapped = mapRpcError(error);
          code = mapped.code;
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw mapped;
        } finally {
          if (!responseIsStream) finish();
        }

        function finish() {
          if (finished) return;
          finished = true;
          const attributes = {
            'rpc.system': 'grpc',
            'rpc.service': service,
            'rpc.method': method,
            'rpc.grpc.status_code': code,
          };
          const elapsed = performance.now() - started;
          span.setAttributes(attributes);
          calls.add(1, attributes);
          duration.record(elapsed, attributes);
          logger?.log('gRPC request completed', {
            req: {
              requestId,
              method: 'POST',
              url: `/${service}/${method}`,
              ...(body === undefined ? {} : { req: body }),
            },
            res: {
              grpcStatusCode: code,
              ...(responseBody === undefined ? {} : { data: responseBody }),
            },
            responseTime: Math.round(elapsed),
            rpc: { service, method },
          });
          span.end();
        }
      }),
    );
  };
}

function safeRequestId(value: string | null): string {
  return value && /^[a-zA-Z0-9._:-]{1,128}$/.test(value) ? value : randomUUID();
}
