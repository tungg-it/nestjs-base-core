import { AppError, AppErrorData, AppErrorOptions } from './app-error';

export interface ErrorDefinition {
  code: string;
  httpStatus: number;
  messageKey: string | ((...args: unknown[]) => string);
  messageArgs?: (...args: unknown[]) => Record<string, unknown> | undefined;
  message?: string | ((...args: unknown[]) => string | undefined);
  data?: (...args: unknown[]) => unknown;
}

type MessageArgs<M> = M extends (...args: infer A) => string | undefined ? A : [];

export type ErrorThrower<M> = <TData = AppErrorData>(...args: [...MessageArgs<M>, AppErrorOptions<TData>?]) => AppError;

export function createErrorFactory<const T extends Record<string, ErrorDefinition>>(defs: T) {
  const factory = {} as { [K in keyof T]: ErrorThrower<T[K]['message']> };

  for (const key in defs) {
    const def = defs[key];
    const arity =
      typeof def.message === 'function'
        ? def.message.length
        : typeof def.messageKey === 'function'
          ? def.messageKey.length
          : 0;

    factory[key] = (...args: unknown[]) => {
      const messageArgs: unknown[] = args.slice(0, arity);
      const options = args[arity] as AppErrorOptions<unknown> | undefined;
      const override = typeof def.message === 'function' ? def.message(...messageArgs) : def.message;
      const i18nKey = typeof def.messageKey === 'function' ? def.messageKey(...messageArgs) : def.messageKey;
      const i18nArgs = def.messageArgs?.(...messageArgs);
      const data = options?.data ?? (typeof def.data === 'function' ? def.data(...messageArgs) : undefined);

      const errorOptions: AppErrorOptions<unknown> = {
        ...options,
        ...(data !== undefined ? { data } : {}),
      };

      if (override) {
        return new AppError(def.code, def.httpStatus, override, errorOptions);
      }

      return new AppError(def.code, def.httpStatus, i18nKey, {
        ...errorOptions,
        messageKey: i18nKey,
        messageArgs: i18nArgs,
      });
    };
  }

  return factory;
}
