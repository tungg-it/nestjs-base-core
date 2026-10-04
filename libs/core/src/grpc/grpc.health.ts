import { Injectable } from '@nestjs/common';
import { Code, ConnectError, type ServiceImpl } from '@connectrpc/connect';
import { Health, HealthCheckResponse_ServingStatus as ServingStatus } from '@libs/contracts/grpc/health/v1/health_pb';

type HealthResponse = { status: ServingStatus };

@Injectable()
export class GrpcHealth implements ServiceImpl<typeof Health> {
  private readonly statuses = new Map<string, ServingStatus>([['', ServingStatus.NOT_SERVING]]);
  private readonly listeners = new Map<string, Set<(status: ServingStatus) => void>>();

  check: ServiceImpl<typeof Health>['check'] = (request) => {
    const status = this.statuses.get(request.service);
    if (status === undefined) throw new ConnectError('Unknown service', Code.NotFound);
    return { status };
  };

  watch: ServiceImpl<typeof Health>['watch'] = async function* (this: GrpcHealth, request, context) {
    const service = request.service;
    const queue: ServingStatus[] = [this.statuses.get(service) ?? ServingStatus.SERVICE_UNKNOWN];
    let wake: (() => void) | undefined;
    const notify = (status: ServingStatus) => {
      queue.push(status);
      wake?.();
    };
    const listeners = this.listeners.get(service) ?? new Set();
    listeners.add(notify);
    this.listeners.set(service, listeners);
    const onAbort = () => wake?.();
    context.signal.addEventListener('abort', onAbort);
    try {
      while (!context.signal.aborted) {
        if (queue.length === 0) {
          await new Promise<void>((resolve) => (wake = resolve));
          wake = undefined;
          continue;
        }
        yield { status: queue.shift() } satisfies HealthResponse;
      }
    } finally {
      context.signal.removeEventListener('abort', onAbort);
      listeners.delete(notify);
      if (listeners.size === 0) this.listeners.delete(service);
    }
  };

  setStatus(service: string, status: ServingStatus): void {
    this.statuses.set(service, status);
    for (const listener of this.listeners.get(service) ?? []) listener(status);
  }

  setServices(services: string[]): void {
    for (const service of services) this.setStatus(service, ServingStatus.SERVING);
    this.setStatus('', ServingStatus.SERVING);
  }

  shutdown(): void {
    for (const service of this.statuses.keys()) this.setStatus(service, ServingStatus.NOT_SERVING);
  }
}
