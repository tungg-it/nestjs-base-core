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
- [Author](#-author)

---

## ✨ Features

- 🏗️ **Monorepo Architecture** - Organized structure with shared libraries
- 🌐 **REST API** - POST-based endpoints with Swagger documentation
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
│   └── 📂 util/                # Common utilities & helpers
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

### Throwing HTTP Exceptions

```typescript
import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

@Controller('items')
export class ItemsController {
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const item = null; // pretend lookup
    if (!item) {
      const i18n = I18nContext.current();
      throw new HttpException(i18n.t('message.errors.object_not_found'), HttpStatus.NOT_FOUND);
    }
    return item;
  }
}
```

> 💡 **Tip:** The global `HttpExceptionFilter` automatically maps plain keys through `message.errors.*`:
>
> ```typescript
> throw new HttpException('not_found', HttpStatus.NOT_FOUND);
> // -> Responds with translated `message.errors.not_found`
> ```

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
