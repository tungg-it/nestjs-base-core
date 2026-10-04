export interface AppConfig {
  environment: string;
  devMode: boolean;
  apiDocument: string;
  apiPort: number;
  isApi: boolean;
  isConsumer: boolean;
  isCron: boolean;
  grpc: {
    api: GrpcAppConfig;
  };
}

export interface GrpcTlsConfig {
  caPath?: string;
  certPath?: string;
  keyPath?: string;
  requireClientCertificate?: boolean;
}

export interface GrpcAppConfig {
  enabled: boolean;
  host: string;
  port: number;
  endpoint: string;
  plaintext: boolean;
  tls?: {
    certPath?: string;
    keyPath?: string;
    caPath?: string;
    requireClientCertificate?: boolean;
  };
  maxMessageBytes: number;
  maxTimeoutMs: number;
  shutdownGraceMs: number;
}
