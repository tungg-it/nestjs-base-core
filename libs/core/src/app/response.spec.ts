import type { ExecutionContext } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { lastValueFrom, of } from 'rxjs';
import { getHttpResponseData } from '../logger/http-response-data';
import { getHttpRequestData } from '../logger/http-request-data';
import { ResponseInterceptor } from './response';

describe('ResponseInterceptor', () => {
  it('captures a masked response body for the HTTP completion log', async () => {
    const socket = new Socket();
    const request = new IncomingMessage(socket);
    const response = new ServerResponse(request);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ raw: request, body: data }),
        getResponse: () => ({ raw: response }),
      }),
    } as unknown as ExecutionContext;
    const data = { user: { name: 'Tung', password: 'secret' } };

    try {
      await expect(
        lastValueFrom(
          new ResponseInterceptor().intercept(context, {
            handle: () => of(data),
          }),
        ),
      ).resolves.toEqual({ code: 200, message: 'Ok', data });
      expect(getHttpRequestData(request)).toEqual({
        user: { name: 'Tung', password: '[Redacted]' },
      });
      expect(getHttpResponseData(response)).toEqual({
        code: 200,
        message: 'Ok',
        data: { user: { name: 'Tung', password: '[Redacted]' } },
      });
    } finally {
      socket.destroy();
    }
  });
});
