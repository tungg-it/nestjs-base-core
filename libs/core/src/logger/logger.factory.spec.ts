import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { serializeRequest, serializeResponse } from './logger.factory';
import { setHttpResponseData } from './http-response-data';
import { setHttpRequestData } from './http-request-data';

describe('request log serializers', () => {
  it('keeps the already shaped gRPC request and response fields', () => {
    const req = {
      requestId: 'trace-123',
      method: 'POST',
      url: '/doit.example.v1.ExampleService/Echo',
      body: { text: 'hello' },
    };
    const res = { grpcStatusCode: 0 };

    expect(serializeRequest(req)).toEqual(req);
    expect(serializeResponse(res)).toEqual(res);
  });

  it('still reduces HTTP request and response objects', () => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.headers['x-request-id'] = 'http-123';
    req.method = 'POST';
    req.url = '/api/v1/example';
    setHttpRequestData(req, { text: 'hello', token: '[Redacted]' });
    const res = new ServerResponse(req);
    res.statusCode = 200;
    setHttpResponseData(res, { code: 200, message: 'Ok', data: { text: 'hello' } });

    expect(serializeRequest(req)).toEqual({
      requestId: 'http-123',
      method: 'POST',
      url: '/api/v1/example',
      body: { text: 'hello', token: '[Redacted]' },
    });
    expect(serializeRequest(req, false)).toEqual({
      requestId: 'http-123',
      method: 'POST',
      url: '/api/v1/example',
    });
    expect(serializeResponse(res)).toEqual({
      statusCode: 200,
      data: { code: 200, message: 'Ok', data: { text: 'hello' } },
    });
    expect(serializeResponse(res, false)).toEqual({ statusCode: 200 });
    socket.destroy();
  });
});
