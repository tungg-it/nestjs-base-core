# Domain Docs

How engineering skills consume this repository's context before exploring or changing the codebase.

## Before exploring

- Read **CONTEXT.md** at the repository root.
- Read relevant records in **docs/adr/** when the work changes an architectural boundary or platform contract.
- If an ADR or the directory does not yet exist, proceed without flagging its absence. Create a record only when a decision becomes durable.

## Layout

This is a **single-context** repository:

```text
/
├── CONTEXT.md
├── docs/
│   ├── adr/                  durable architectural decisions
│   └── agents/               agent operating documentation
├── apps/api/                 application composition
├── proto/                    source protobuf contracts
└── libs/
    ├── contracts/            generated protobuf descriptors
    ├── core/                 shared platform runtime
    └── util/                 shared primitives
```

## Use the established vocabulary

Treat the concepts in **CONTEXT.md** as the authoritative names for platform behaviour: core contracts, response envelope, AppError, CommonErrors, validation pipe, and feature provider. Avoid inventing domain language for the base project.

If a task introduces a genuine product domain, add its vocabulary to **CONTEXT.md** or establish an appropriate context map before it spreads through APIs, tests, and tickets.

## gRPC boundary

gRPC is a transport and platform concern, not a product domain. Protobuf packages define wire contracts and must use versioned names such as `example.v1`; they do not establish a second bounded context by themselves.

- **proto/** is the source of truth for RPC contracts.
- **libs/contracts/** contains generated descriptors and must not contain business logic.
- **libs/core/src/grpc/** owns shared transport behavior such as discovery, health checks, deadlines, retries, TLS, telemetry, error mapping, and shutdown.
- RPC handlers adapt protobuf messages to application or domain services. Business rules remain outside transport handlers.
- Use the same domain vocabulary across REST DTOs, protobuf messages, application services, tests, and documentation. Transport-specific names may differ only where the protocol requires it.

Read **docs/agents/grpc-rules.md** before changing protobuf contracts or gRPC server/client behavior.

## ADR conflicts

When a proposed change conflicts with an existing ADR, state the conflict explicitly and explain why reopening that decision is warranted.
