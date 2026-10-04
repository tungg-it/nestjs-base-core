<div align="center">

# 🚀 NestJS Base Monorepo

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Running the Application](#-running-the-application)
- [Docker](#-docker)
- [Code Generation](#-code-generation)
- [Validation \& i18n](#-validation--i18n)
- [gRPC](#-grpc)
- [Author](#-author)

---

## ✨ Features

- 🏗️ **Monorepo Architecture** - Organized structure with shared libraries
- 🌐 **REST API** - POST-based endpoints with Swagger documentation
- 🔌 **Typed gRPC** - ConnectRPC over HTTP/2 with protobuf contracts, health checks, TLS, deadlines and telemetry
- 🌍 **Internationalization (i18n)** - Multi-language support (EN/VI)
- ✅ **Validation** - Built-in validation with translated error messages
- 🐳 **Docker Ready** - Production-ready Docker configuration
- ⚡ **Code Generation** - CLI tools for generating apps and modules
- 📝 **TypeScript** - Full TypeScript support with strict mode

---

## 🛠️ Tech Stack

| Technology                                    | Description                                |
| --------------------------------------------- | ------------------------------------------ |
| [NestJS](https://docs.nestjs.com/)            | Progressive Node.js framework              |
| [TypeScript](https://www.typescriptlang.org/) | Typed JavaScript                           |
| [Node.js](https://nodejs.org/)                | v22 or later                               |
| [pnpm](https://pnpm.io/)                      | Fast, disk space efficient package manager |
| [Docker](https://www.docker.com/)             | Containerization platform                  |
| [Swagger](https://swagger.io/)                | API documentation                          |
| [ConnectRPC](https://connectrpc.com/)         | Typed gRPC server and client transport     |
| [Buf](https://buf.build/)                     | Protobuf linting and code generation       |

---

## 📁 Project Structure

```
nestjs-base-core/
├── 📂 apps/                    # Application services
│   ├── 📂 api/                 # Main API service
│   ├── 📂 chatbot/             # Chatbot service
│   └── 📂 worker/              # Background worker service
├── 📂 libs/                    # Shared libraries
│   ├── 📂 core/                # Core utilities & configurations
│   │   └── 📂 src/
│   │       ├── 📂 app/         # App bootstrap & common modules
│   │       ├── 📂 config/      # Configuration management
│   │       ├── 📂 exception/   # Exception filters
│   │       ├── 📂 i18n/        # Internationalization files
│   │       └── 📂 middleware/  # Custom middlewares
│   ├── 📂 contracts/           # Generated protobuf contracts
│   └── 📂 util/                # Common utilities & helpers
├── 📂 proto/                   # Source .proto contracts
├── 📂 script/                  # Code generation scripts
├── 📄 docker-compose.yaml      # Docker Compose configuration
├── 📄 nest-cli.json            # NestJS CLI configuration
└── 📄 package.json             # Project dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v24 or later
- **pnpm** package manager
- **Docker** & Docker Compose (optional, for containerization)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/tungg-it/nestjs-base-core.git
cd nestjs-base-core
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment**

```bash
cp .env.example .env
# Edit .env file with your configuration
```

---

## 🏃 Running the Application

### Development Mode

```bash
# Start without watching
pnpm start

# Start with hot-reload (watching)
pnpm dev
```

### Production Mode

```bash
pnpm prod
```

### Build Application

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```

---

## 🐳 Docker

### Using Docker Compose

| Command                           | Description                     |
| --------------------------------- | ------------------------------- |
| `docker-compose up -d`            | Build and start the application |
| `docker-compose logs -f api`      | View logs                       |
| `docker-compose down`             | Stop the application            |
| `docker-compose build --no-cache` | Rebuild the image               |
| `docker-compose restart api`      | Restart the service             |

> 📍 The API service will be available at `http://localhost:8080`

### Using Docker Directly

**Build the image:**

```bash
docker build -f apps/api/Dockerfile -t nestjs-base-api .
```

**Run the container:**

```bash
docker run -d \
  --name nestjs-base-api \
  -p 8080:8080 \
  --env-file .env \
  nestjs-base-api
```

**Manage container:**

```bash
# View logs
docker logs -f nestjs-base-api

# Stop container
docker stop nestjs-base-api

# Remove container
docker rm nestjs-base-api
```

---

## ⚙️ Code Generation

### Generate a New Application

```bash
pnpm gen:app <app-name>

# Examples
pnpm gen:app auth
pnpm gen:app payment-gateway
```

### Generate a New Module

```bash
pnpm gen:module <app-name> <module-name>

# Example: Create "user" module in "api" app
pnpm gen:module api user
```

---

## 🌍 Validation & i18n

The project includes `nestjs-i18n` with a global `I18nValidationPipe` and pre-configured validation messages.

### Supported Languages

| Language          | Header Value |
| ----------------- | ------------ |
| English (default) | `x-lang: en` |
| Vietnamese        | `x-lang: vi` |

### Define DTOs with i18n Messages

```typescript
// apps/api/src/example/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @IsEmail({}, { message: i18nValidationMessage('validation.string.email') })
  email: string;

  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @MinLength(8, {
    message: i18nValidationMessage('validation.string.min', {
      args: { min: 8, property: 'password' },
    }),
  })
  password: string;
}
```

---

## 🔌 gRPC

The core library provides a native HTTP/2 gRPC server and typed clients through ConnectRPC. It includes Nest provider discovery, protobuf validation, the standard `grpc.health.v1.Health` service, request IDs, OpenTelemetry spans/metrics, bounded deadlines, safe retries for explicitly idempotent methods, TLS/mTLS and graceful shutdown.

### Generate contracts

Add schemas below `proto/<domain>/v1/`, then lint and generate TypeScript descriptors:

```bash
pnpm proto:lint
pnpm proto:gen
```

Generated files are written to `libs/contracts/src/generated`. Do not edit them by hand. The repository includes `proto/example/v1/example.proto` as a minimal example.

### Implement and register a server

The handler must be a singleton Nest provider and must implement every RPC in its service descriptor.

```typescript
import { Injectable, Module } from '@nestjs/common';
import type { ServiceImpl } from '@connectrpc/connect';
import { GrpcServerModule, RpcService } from '@libs/core';
import { ExampleService } from '@libs/contracts/generated/example/v1/example_pb';

@Injectable()
@RpcService(ExampleService)
export class ExampleRpcHandler implements ServiceImpl<typeof ExampleService> {
  echo: ServiceImpl<typeof ExampleService>['echo'] = (request) => ({
    text: request.text,
  });
}

@Module({
  imports: [GrpcServerModule.register('api')],
  providers: [ExampleRpcHandler],
})
export class ExampleGrpcModule {}
```

Import `ExampleGrpcModule` from the application module. `GrpcServerModule.register('api')` reads `grpc.api`, which is populated by the included environment configuration:

```dotenv
GRPC_ENABLED=true
GRPC_HOST=0.0.0.0
GRPC_PORT=50051
GRPC_PLAINTEXT=true
```

Plaintext is rejected in production. Set `GRPC_PLAINTEXT=false` and configure `GRPC_TLS_CERT_PATH`, `GRPC_TLS_KEY_PATH`, and optionally `GRPC_TLS_CA_PATH` for TLS/mTLS.

Limit a handler to selected environments when it is only intended for development or testing:

```typescript
@RpcService(ExampleService, { environments: ['development', 'test'] })
```

### Register and inject a typed client

Add a target to a configuration factory:

```typescript
export default () => ({
  grpc: {
    example: {
      endpoint: process.env.EXAMPLE_GRPC_ENDPOINT,
      plaintext: process.env.NODE_ENV !== 'production',
      deadlineMs: 5_000,
      idempotentMethods: ['Echo'],
      retry: { maxAttempts: 3, initialDelayMs: 50 },
    },
  },
});
```

Register the target connection, inject its shared resource, and create the typed client once in the consumer:

```typescript
import { Injectable, Module } from '@nestjs/common';
import type { Client } from '@connectrpc/connect';
import { GrpcClientModule, GrpcClientResource, InjectGrpcClient } from '@libs/core';
import { ExampleService } from '@libs/contracts/generated/example/v1/example_pb';

@Injectable()
export class ExampleGateway {
  private readonly client: Client<typeof ExampleService>;

  constructor(@InjectGrpcClient('example') grpc: GrpcClientResource) {
    this.client = grpc.clientFor(ExampleService);
  }

  echo(text: string) {
    return this.client.echo({ text }, { headers: { 'x-request-id': crypto.randomUUID() } });
  }
}

@Module({
  imports: [GrpcClientModule.register('example')],
  providers: [ExampleGateway],
})
export class ExampleClientModule {}
```

Only allowlisted metadata is propagated. `authorization` must additionally be enabled per RPC with `authorizationMethods`; retries occur only for methods listed in `idempotentMethods`, only for `UNAVAILABLE`, and never more than three attempts.

### Health and shutdown

Every enabled server exposes `grpc.health.v1.Health/Check` and `/Watch`. Registered services become `SERVING` after startup and transition to `NOT_SERVING` during shutdown. Keep `app.enableShutdownHooks()` enabled so clients close HTTP/2 sessions and servers honor `shutdownGraceMs`.

---

## 🌍 Validation & i18n examples

### Controller Example

```typescript
// apps/api/src/example/example.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('example')
export class ExampleController {
  @Post('users')
  create(@Body() body: CreateUserDto) {
    return { ok: true };
  }
}
```

### Response Examples

**English Response:**

```json
{
  "statusCode": 400,
  "message": ["email must be a valid email", "password must be at least 8 characters"],
  "error": "Bad Request"
}
```

**Vietnamese Response (`x-lang: vi`):**

```json
{
  "statusCode": 400,
  "message": ["email phải là email hợp lệ", "password phải có ít nhất 8 ký tự"],
  "error": "Yêu cầu không hợp lệ"
}
```

### Using Translated Messages

```typescript
import { I18nContext } from 'nestjs-i18n';

// Get current i18n context
const i18n = I18nContext.current();
const msg = i18n.t('message.errors.not_found');

// With interpolation
const text = i18n.t('message.welcome', { args: { name: 'Tùng' } });
```

### Throwing Errors

Use `CommonErrors` from `@libs/util` instead of calling `HttpException` and translating messages manually. Each thrower returns an `AppError` with a stable `statusCode`, HTTP status, and i18n key resolved by the global `HttpExceptionFilter`.

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { CommonErrors } from '@libs/util';

@Controller('items')
export class ItemsController {
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const item = null; // pretend lookup
    if (!item) {
      throw CommonErrors.notFound('Item');
    }
    return item;
  }
}
```

**Common throwers:**

| Method                                       | HTTP | `statusCode`            | Use case                      |
| -------------------------------------------- | ---- | ----------------------- | ----------------------------- |
| `CommonErrors.badRequest(detail?, options?)` | 400  | `BAD_REQUEST`           | Invalid input / business rule |
| `CommonErrors.unauthenticated()`             | 401  | `UNAUTHENTICATED`       | Missing or invalid auth       |
| `CommonErrors.forbidden()`                   | 403  | `FORBIDDEN`             | Authenticated but not allowed |
| `CommonErrors.notFound(resource?)`           | 404  | `NOT_FOUND`             | Resource not found            |
| `CommonErrors.conflict(detail?, options?)`   | 409  | `CONFLICT`              | Duplicate / state conflict    |
| `CommonErrors.validationFailed(options?)`    | 422  | `VALIDATION_FAILED`     | Field-level validation errors |
| `CommonErrors.tooManyRequests()`             | 429  | `TOO_MANY_REQUESTS`     | Rate limiting                 |
| `CommonErrors.internal()`                    | 500  | `INTERNAL_SERVER_ERROR` | Unexpected server error       |

**Custom message with extra payload:**

```typescript
throw CommonErrors.badRequest('Custom error', {
  data: { field: 'value' },
});
```

**Validation errors with field details:**

```typescript
throw CommonErrors.validationFailed({
  data: [{ field: 'email', key: 'isEmail', message: 'email must be a valid email' }],
});
```

**Response shape** (handled by `HttpExceptionFilter`):

```json
{
  "code": 404,
  "statusCode": "NOT_FOUND",
  "message": "Item not found",
  "data": null,
  "cause": null,
  "timestamp": "2026-07-07T06:46:00.000Z",
  "path": "/api/v1/items/123"
}
```

> 💡 **Tip:** Unhandled `Error` instances are converted to a safe 500 response. Prefer `CommonErrors.internal()` when you need an explicit server error.

### Custom Domain Errors

Define module-specific errors with `createErrorFactory`:

```typescript
// apps/api/src/modules/user/user.errors.ts
import { createErrorFactory } from '@libs/util';

export const UserErrors = createErrorFactory({
  emailTaken: {
    code: 'EMAIL_TAKEN',
    httpStatus: 409,
    messageKey: 'message.errors.object_existed',
  },
});
```

```typescript
import { UserErrors } from './user.errors';

if (await this.users.existsByEmail(email)) {
  throw UserErrors.emailTaken();
}
```

### i18n Files Location

- `libs/core/src/i18n/en/validation.json`
- `libs/core/src/i18n/en/message.json`
- `libs/core/src/i18n/vi/validation.json`
- `libs/core/src/i18n/vi/message.json`

---

## 👨‍💻 Author

<div align="center">

**Tùng IT**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/tungg-it)
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/tungtt.dev/)
[![TikTok](https://img.shields.io/badge/TikTok-000000?style=for-the-badge&logo=tiktok&logoColor=white)](https://www.tiktok.com/@.tung_it)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:tung.webdeveloper@gmail.com)

</div>

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ If you find this project helpful, please give it a star!**

Made with ❤️ by [Tùng IT](https://github.com/tungg-it)

</div>
