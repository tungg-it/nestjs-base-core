# Code Conventions

## Source of truth and verification

Use pnpm; the exact supported scripts live in **package.json**. The normal verification commands are **pnpm build**, **pnpm test**, and **pnpm lint**. The lint script runs ESLint with **--fix**, so inspect the working tree afterward. Husky formats staged files with Prettier.

Format TypeScript with two spaces, single quotes, trailing commas, and a 120-character print width. TypeScript is not fully strict in the root configuration, but new code should still give values meaningful types and keep unsafe boundaries narrow. Prefix intentionally unused parameters or locals with an underscore.

## Workspace structure

- Use **@apps/api/** for API-local imports, **@libs/core** for platform services, and **@libs/util** for shared primitives.
- Keep reusable exports in the existing barrel files. Do not import one application from another or import application code into a shared library.
- Keep HTTP transport adapters in **apps/<app>/src/modules/<module>/api/**. Keep feature services, DTOs, and mapping functions in the module's **features/** tree.
- Use the local module's **features** provider array to wire generated feature services. **features/index.ts** is generator-owned; regenerate it with **pnpm feat:gen <app> <module> <feature>** instead of manually editing it.
- Create a module with **pnpm module:gen <app> <module>** and an application with **pnpm app:gen <app>** when the task fits the supplied scaffold.

## NestJS and API behaviour

- Compose each application through **commonModules({ appName })** and boot it through **startApp**. Cross-cutting pipes, filters, interceptors, and Fastify configuration stay in **libs/core**.
- Controllers validate input with DTOs and pipes, delegate to feature services, and return payload data. The global response interceptor owns the success envelope.
- Decorate public API endpoints with the relevant Swagger metadata. Follow the example module's DTO and route style when it is applicable.
- Use **CommonErrors** for expected HTTP failures. Define module-specific stable error codes with **createErrorFactory**; do not handcraft incompatible error bodies.

## Validation, i18n, configuration, and logging

- Use class-validator decorators for DTO constraints. Apply **Trim** to user-controlled strings and **ToNumber** when a string input is expected to become numeric. Use **ParseUuidV7Pipe** for UUID v7 route parameters.
- New shared translated messages belong in both English and Vietnamese catalogues. Reuse the built-in constraint translation mapping before writing a per-field literal message.
- Add configuration coherently: type in **AppConfig**, default in the configuration factory, and documented value in **.env.example**.
- Inject **AppLogger** and log a concise message plus structured metadata or an Error. Preserve the request-ID flow; do not introduce ad-hoc console logging outside the process-entry failure handler.

## Change boundaries

The current repository deliberately has no persistence, auth, queue, cron, or product domain layer. A task that adds one must establish its module boundary, configuration, error and i18n contract, and any durable decision in an ADR. Do not treat the README's future topology or stale generator comments as an existing implementation.
