import { ServerResponse } from 'node:http';

const responseData = new WeakMap<ServerResponse, unknown>();

export function setHttpResponseData(response: ServerResponse, data: unknown): void {
  responseData.set(response, data);
}

export function getHttpResponseData(response: ServerResponse): unknown {
  return responseData.get(response);
}
