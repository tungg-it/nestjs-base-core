import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppLogger {
  constructor(private readonly logger: PinoLogger) {}

  setContext(context: string): void {
    this.logger.setContext(context);
  }

  log(message: string, data?: Record<string, unknown>): void {
    if (data !== undefined) {
      this.logger.info(data, message);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (data !== undefined) {
      this.logger.warn(data, message);
    } else {
      this.logger.warn(message);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (data !== undefined) {
      this.logger.debug(data, message);
    } else {
      this.logger.debug(message);
    }
  }

  error(message: string, traceOrMeta?: unknown): void {
    if (traceOrMeta instanceof Error) {
      this.logger.error({ err: traceOrMeta }, message);
      return;
    }
    if (
      traceOrMeta !== undefined &&
      traceOrMeta !== null &&
      typeof traceOrMeta === 'object' &&
      !Array.isArray(traceOrMeta)
    ) {
      this.logger.error(traceOrMeta as Record<string, unknown>, message);
      return;
    }
    if (traceOrMeta !== undefined && traceOrMeta !== null) {
      this.logger.error({ trace: traceOrMeta }, message);
      return;
    }
    this.logger.error(message);
  }
}
