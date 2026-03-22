import { LoggerService } from '@nestjs/common';

/** Contexts Nest uses for bootstrap / routing messages (pino `context` field). */
const NEST_FRAMEWORK_INFO_CONTEXTS = new Set([
  'NestFactory',
  'InstanceLoader',
  'RoutesResolver',
  'RouterExplorer',
  'NestApplication',
]);

const NEST_ROUTE_MIGRATION_WARN = 'LegacyRouteConverter';

function lastContext(optionalParams: unknown[]): string | undefined {
  if (optionalParams.length === 0) return undefined;
  const last = optionalParams[optionalParams.length - 1];
  return typeof last === 'string' ? last : undefined;
}

function shouldSkipInfoLike(context: string | undefined): boolean {
  return context !== undefined && NEST_FRAMEWORK_INFO_CONTEXTS.has(context);
}

function shouldSkipWarn(context: string | undefined): boolean {
  return context === NEST_ROUTE_MIGRATION_WARN;
}

/**
 * Drops Nest framework bootstrap/route-mapping logs while keeping app logs
 * (e.g. your own `context` from `AppLogger` / `setContext`).
 */
export function wrapLoggerSkipNestFramework(
  delegate: LoggerService,
): LoggerService {
  return {
    log(message: unknown, ...optionalParams: unknown[]) {
      if (shouldSkipInfoLike(lastContext(optionalParams))) return;
      delegate.log(message, ...optionalParams);
    },
    verbose(message: unknown, ...optionalParams: unknown[]) {
      if (shouldSkipInfoLike(lastContext(optionalParams))) return;
      delegate.verbose?.(message, ...optionalParams);
    },
    debug(message: unknown, ...optionalParams: unknown[]) {
      if (shouldSkipInfoLike(lastContext(optionalParams))) return;
      delegate.debug?.(message, ...optionalParams);
    },
    warn(message: unknown, ...optionalParams: unknown[]) {
      if (shouldSkipWarn(lastContext(optionalParams))) return;
      delegate.warn(message, ...optionalParams);
    },
    error(message: unknown, ...optionalParams: unknown[]) {
      delegate.error(message, ...optionalParams);
    },
    fatal(message: unknown, ...optionalParams: unknown[]) {
      delegate.fatal?.(message, ...optionalParams);
    },
  };
}
