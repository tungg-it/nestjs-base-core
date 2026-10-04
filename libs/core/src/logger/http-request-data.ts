import { IncomingMessage } from 'node:http';

const requestData = new WeakMap<IncomingMessage, unknown>();

export function setHttpRequestData(request: IncomingMessage, data: unknown): void {
  requestData.set(request, data);
}

export function getHttpRequestData(request: IncomingMessage): unknown {
  return requestData.get(request);
}
