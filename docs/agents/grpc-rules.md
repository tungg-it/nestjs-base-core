# Protobuf and gRPC Rules

## Contract

- `.proto` files in `proto/` are the source of truth; never edit files generated in `libs/contracts/src/generated`.
- Packages must include a version, such as `billing.v1`. Use PascalCase for services, messages, and RPCs, and snake_case for fields.
- Never change field numbers or reuse removed fields. Mark removed field numbers and names as `reserved`.
- Contract changes must run `pnpm proto:lint` and `pnpm proto:gen`, and the source and generated output must be committed together.

## Server

- RPC handlers must be singleton providers, use `@RpcService(ServiceDescriptor)`, and fully implement `ServiceImpl<typeof ServiceDescriptor>`.
- Keep business logic out of transport handlers. Handlers call application or domain services and map results to protobuf messages.
- Never expose infrastructure errors or stack traces to clients. Use `AppError` or `ConnectError`; unrecognized errors must become `INTERNAL` errors with a safe message.
- Every RPC must have a finite deadline, message limits, and structured telemetry. Payloads may only be logged in development and must be masked first.
- Production requires TLS. mTLS requires a CA and `requireClientCertificate`. Never downgrade to HTTP/1.

## Client

- Inject a shared `GrpcClientResource` with `@InjectGrpcClient(name)`, then create and retain typed clients with
  `clientFor(descriptor)`; do not create transports throughout feature code.
- Propagate allowlisted metadata only. Permit `authorization` only for explicitly declared RPCs.
- Retry only explicitly listed idempotent RPCs, at most three times, only for `UNAVAILABLE`, and always within the original deadline.
- Production endpoints must use HTTPS. Client certificates and private keys must always be configured as a pair.

## Lifecycle and testing

- Always enable `app.enableShutdownHooks()` so health transitions to `NOT_SERVING`, servers drain sessions, and clients abort sessions.
- At minimum, test the typed RPC happy path, validation and error mapping, health checks, duplicate or missing handlers, deadlines or connection failures, and graceful shutdown when changing the related behavior.
