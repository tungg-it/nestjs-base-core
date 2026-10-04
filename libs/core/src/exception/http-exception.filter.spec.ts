import type { ArgumentsHost } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { HttpAdapterHost } from '@nestjs/core';
import { Code, ConnectError } from '@connectrpc/connect';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([Code.Unavailable, Code.Unimplemented])('maps upstream gRPC code %s to HTTP 503', (code) => {
    const response = {};
    const request = { url: '/api/v1/example/ai-echo2' };
    const reply = jest.fn();
    const httpAdapterHost = {
      httpAdapter: {
        getRequestUrl: () => request.url,
        reply,
      },
    } as unknown as HttpAdapterHost;
    const config = { get: () => 'test' } as unknown as ConfigService;
    const host = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    new HttpExceptionFilter(httpAdapterHost, config).catch(new ConnectError('RPC unavailable', code), host);

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        code: 503,
        statusCode: 'SERVICE_UNAVAILABLE',
        data: null,
        cause: null,
        path: request.url,
      }),
      503,
    );
  });
});
