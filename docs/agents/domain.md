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
└── libs/
    ├── core/                 shared platform runtime
    └── util/                 shared primitives
```

## Use the established vocabulary

Treat the concepts in **CONTEXT.md** as the authoritative names for platform behaviour: core contracts, response envelope, AppError, CommonErrors, validation pipe, and feature provider. Avoid inventing domain language for the base project.

If a task introduces a genuine product domain, add its vocabulary to **CONTEXT.md** or establish an appropriate context map before it spreads through APIs, tests, and tickets.

## ADR conflicts

When a proposed change conflicts with an existing ADR, state the conflict explicitly and explain why reopening that decision is warranted.
