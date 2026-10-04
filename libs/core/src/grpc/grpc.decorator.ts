import type { DescService } from '@bufbuild/protobuf';
import { DiscoveryService } from '@nestjs/core';

export interface RpcServiceOptions {
  environments?: readonly string[];
}

export interface RpcServiceMetadata extends RpcServiceOptions {
  service: DescService;
}

export const rpcServiceDecorator = DiscoveryService.createDecorator<RpcServiceMetadata>();

export const RpcService = (service: DescService, options: RpcServiceOptions = {}): ClassDecorator =>
  rpcServiceDecorator({ service, ...options });
