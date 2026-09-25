# NestJS Base Core

This repository is a reusable NestJS platform base. The current API example demonstrates platform behaviour; it is not a business-domain implementation.

## Repository maps

- **Core contracts:** Before changing bootstrap, HTTP responses or errors, configuration, logging, validation, i18n, or workspace dependency boundaries, read [CONTEXT.md](CONTEXT.md).
- **Implementation conventions:** Before adding or editing TypeScript, NestJS modules/features, DTOs, or code generators, read [docs/agents/code-conventions.md](docs/agents/code-conventions.md).
- **Architecture decisions:** Before a structural change, read any relevant record in **docs/adr/**. Create an ADR only when a durable architectural decision is made.

## Agent skills

### Issue tracker

Issues and specs are tracked locally under **.scratch/**. See [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

Use the default canonical triage labels. See [docs/agents/triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

This repository uses single-context domain documentation. See [docs/agents/domain.md](docs/agents/domain.md).
