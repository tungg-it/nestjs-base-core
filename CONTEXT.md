# NestJS Base Core Context

## Purpose

This is a reusable NestJS platform base, not a product-specific service. It establishes the shared runtime contracts that future applications and modules inherit: Fastify bootstrapping, API versioning, response and error envelopes, validation, i18n, logging, configuration, and feature scaffolding.

The only application is **apps/api**. Its **example** module is an executable reference for DTO transformation, validation, UUID v7 parameters, error handling, and Swagger decorators. It is not a business domain to extend unless a task explicitly says so.

## System map

```text
apps/api                 application composition and HTTP example
  └── modules/*          transport adapters and feature providers
libs/core                shared NestJS runtime and cross-cutting contracts
  ├── app                startApp, common modules, response, timeout, health check
  ├── config             environment mapping and AppConfig
  ├── exception          uniform HTTP exception handling
  ├── i18n               English and Vietnamese message catalogs
  ├── logger             Pino integration and AppLogger
  ├── middleware         request ID and optional Morgan middleware
  └── validation         decorators, pipes, and translated constraint messages
libs/util                shared errors, constants, helpers, and HTTP message names
script/core              app, module, and feature generators
```

Workspace imports flow from applications to **@libs/core** and **@libs/util**, and from core to util. Shared libraries must not import application code. Expose reusable library APIs through their existing barrel files; consumers use the configured aliases rather than relative paths across workspace boundaries.

## HTTP contract

**startApp** is the standard HTTP bootstrap. For the API app it sets the global prefix **/api**, URI versioning with default version **v1**, CORS, a global validation pipe, response and timeout interceptors, and the global HTTP exception filter. Keep those cross-cutting behaviours centralized; endpoint handlers return their payload, not a response envelope.

Successful responses are wrapped as:

```json
{ "code": 200, "message": "Ok", "data": "<handler result>" }
```

Expected failures use **CommonErrors** from **@libs/util**. Module-specific expected failures use **createErrorFactory** and stable uppercase error codes. **HttpExceptionFilter** translates known messages, returns a consistent error body, preserves structured client-error data, and deliberately hides server-error causes. Let unexpected exceptions reach the filter; do not leak their details from a controller.

## Validation and localization

The global validation pipe whitelists properties, transforms inputs, rejects unknown values, and converts validation failures to **VALIDATION_FAILED**. DTOs use class-validator plus the shared **Trim**, **ToNumber**, **IsCode**, and **IsUuidV7** decorators where applicable. Parameter UUID v7 validation uses **ParseUuidV7Pipe**.

Localized output resolves through query **lang**, then **Accept-Language**, then **x-lang**; English is the fallback. Every new shared i18n key must have matching entries in both **libs/core/src/i18n/en/** and **libs/core/src/i18n/vi/**. Ordinary class-validator constraints already resolve through **validation.constraints**; add an explicit message only when a field truly needs one.

## Runtime services

Configuration is loaded once through **ConfigModule** and **libs/core/src/config**. A new setting must have an **AppConfig** type entry, a default in the configuration factory, and an example in **.env.example**.

Logging is Pino-backed and includes a request ID. Inject and use **AppLogger** for application logs; it accepts a message plus structured metadata or an Error. Health-check traffic and Nest framework boot noise are intentionally quiet.

## Current boundaries

There is no persistence, authentication, authorization, queue/consumer, cron, or product domain implementation in the committed source. Introduce those only with explicit task scope and record durable platform choices in **docs/adr/**.

The README and generator comments contain some forward-looking examples (such as extra applications, persistence paths, and ADR references) that are absent from the current repository. The committed source tree, **package.json**, **nest-cli.json**, and **tsconfig.json** are authoritative when they differ.
