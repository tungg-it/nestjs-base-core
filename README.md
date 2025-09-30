# Nestjs Base Monorepo By Tùng IT

- Use [NestJS](https://docs.nestjs.com/)
- Use Node.js (v22 or later)
- Use pnpm.
- Add variables in .env file based on .env.example file

## Architecture

- **Framework**: NestJS
- **API Style**: REST API with POST endpoints
- **API Docs**: Swagger

## Project Structure

```
├── apps/                  # Application services
│   ├── api/               # API service
│   └── worker/            # Worker service
└── libs/                  # Shared libraries
    ├── core/              # Core utilities
    └── util/              # Common, helper, interfaces, ...


```

## Installation

```bash
$ pnpm install
```

## Running application

**1. Production.**

```bash
$ prod
```

**2. Development.**

```bash
# No watching
$ pnpm start
```

```bash
# Watching
$ pnpm dev
```

**3. Build application.**

```bash
$ pnpm build
```

## Generate a new service (app)

Create a minimal app

```bash
$ pnpm gen:app <app-name>

# example: create an "auth" app
$ pnpm gen:app auth
```

## Generate a new module

Create a module in app

```bash
$ pnpm gen:module <app-name> <module-name>

# example: create an "user" module in api app
$ pnpm gen:module api user
```

## Lint

```bash
$ pnpm lint
```

## Validation & i18n usage

The project ships with `nestjs-i18n` and a global `I18nValidationPipe` enabled, plus common validation messages under `libs/core/src/i18n/{en,vi}/validation.json`.

### Define DTOs with i18n messages

Use `i18nValidationMessage` from `nestjs-i18n` so validation errors resolve to translation keys. Placeholders like `{property}`, `{min}`, `{max}` are supported via our message templates.

```ts
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

### Controller example

```ts
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

### Switch language

- Default: `x-lang: en`
- Use header: `x-lang: en` or `x-lang: vi`

### Sample response

```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must be at least 8 characters"
  ],
  "error": "Bad Request"
}
```

In Vietnamese (`x-lang: vi`):

```json
{
  "statusCode": 400,
  "message": ["email phải là email hợp lệ", "password phải có ít nhất 8 ký tự"],
  "error": "Yêu cầu không hợp lệ"
}
```

Message keys are defined in:

- `libs/core/src/i18n/en/validation.json`
- `libs/core/src/i18n/vi/validation.json`

### Use translated messages (non-validation)

You can translate standard messages using `I18nContext` and our `message.json` files.

```ts
// Anywhere in a request scope (controller, pipe, filter, service with context)
import { I18nContext } from 'nestjs-i18n';

const i18n = I18nContext.current();
const msg = i18n.t('message.errors.not_found');
```

#### Throwing HTTP exceptions with translated messages

```ts
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

@Controller('items')
export class ItemsController {
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const item = null; // pretend lookup
    if (!item) {
      const i18n = I18nContext.current();
      const message = i18n.t('message.errors.object_not_found');
      throw new HttpException(message, HttpStatus.NOT_FOUND);
    }
    return item;
  }
}
```

#### Using our global HttpExceptionFilter

If you throw `HttpException` with plain keys (like `not_found`), the global filter maps them through `message.errors.*` automatically:

```ts
throw new HttpException('not_found', HttpStatus.NOT_FOUND);
// -> will respond with translated `message.errors.not_found`
```

#### Interpolation and custom namespaces

`message.json` can also contain nested keys. You can pass variables for interpolation:

```ts
// en/message.json
{
  "welcome": "Welcome, {name}!"
}

// usage
const i18n = I18nContext.current();
const text = i18n.t('message.welcome', { args: { name: 'Tùng' } });
```
