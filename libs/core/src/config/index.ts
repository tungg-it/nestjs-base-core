import { AppConfig } from './type';

export default (): AppConfig => ({
  environment: process.env?.NODE_ENV ?? 'development',
  devMode: process.env?.DEV_MODE === 'true',
  apiDocument: process.env?.API_DOCUMENT ?? 'doc',
  apiPort: Number(process.env?.API_PORT ?? 8080),
  isApi: process.env?.IS_API === 'true',
  isConsumer: process.env?.IS_CONSUMER === 'true',
  isCron: process.env?.IS_CRON === 'true',
  grpc: {
    api: grpcConfig('API'),
  },
});

function grpcConfig(prefix: 'API' | 'AI'): AppConfig['grpc']['api'] {
  const host = process.env[`${prefix}_GRPC_HOST`] ?? '127.0.0.1';
  const port = Number(process.env[`${prefix}_GRPC_PORT`] ?? (prefix === 'API' ? 50051 : 50052));
  const plaintext = process.env[`${prefix}_GRPC_PLAINTEXT`] === 'true';
  return {
    enabled: process.env[`${prefix}_GRPC_ENABLED`] === 'true',
    host,
    port,
    endpoint: process.env[`${prefix}_GRPC_ENDPOINT`] ?? `${plaintext ? 'http' : 'https'}://${host}:${port}`,
    plaintext,
    tls: {
      certPath: process.env[`${prefix}_GRPC_TLS_CERT_PATH`],
      keyPath: process.env[`${prefix}_GRPC_TLS_KEY_PATH`],
      caPath: process.env[`${prefix}_GRPC_TLS_CA_PATH`],
      requireClientCertificate: process.env[`${prefix}_GRPC_REQUIRE_CLIENT_CERT`] === 'true',
    },
    maxMessageBytes: Number(process.env[`${prefix}_GRPC_MAX_MESSAGE_BYTES`] ?? 4 * 1024 * 1024),
    maxTimeoutMs: Number(process.env[`${prefix}_GRPC_MAX_TIMEOUT_MS`] ?? 10_000),
    shutdownGraceMs: Number(process.env[`${prefix}_GRPC_SHUTDOWN_GRACE_MS`] ?? 10_000),
  };
}
