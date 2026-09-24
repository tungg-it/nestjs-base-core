export interface AppConfig {
  environment: string;
  devMode: boolean;
  apiDocument: string;
  apiPort: number;
  isApi: boolean;
  isConsumer: boolean;
  isCron: boolean;
}
