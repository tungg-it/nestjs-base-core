#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/*
  Create a new module inside an app at apps/<app>/src/modules/<module>

  Usage:
    node script/create-module.js <app> <module>

  This script will:
  - Create directory apps/<app>/src/modules/<module>
  - Generate controller, service, module, dto, mapper, repo files
  - Import the new Module into apps/<app>/src/app.module.ts (add to imports[])
*/

const fs = require('fs');
const path = require('path');

function exitWithUsage(message) {
  if (message) console.error(message);
  console.error('Usage: node script/create-module.js <app> <module>');
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function toPascalCase(name) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
}

function toKebabCase(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function writeFileIfNotExists(filePath, content) {
  if (fs.existsSync(filePath)) return false;
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function main() {
  const repoRoot = path.resolve(__dirname, '../../');
  const app = process.argv[2];
  const mod = process.argv[3];
  if (!app || !mod) exitWithUsage('Missing <app> or <module>.');

  const appName = app.trim();
  const moduleRawName = mod.trim();
  assert(/^[a-zA-Z0-9\-]+$/.test(appName), 'App must be alphanumeric or dash.');
  assert(
    /^[a-zA-Z0-9\-]+$/.test(moduleRawName),
    'Module must be alphanumeric or dash.',
  );

  const appDir = path.join(repoRoot, 'apps', appName);
  const appSrcDir = path.join(appDir, 'src');
  const appModulePath = path.join(appSrcDir, 'app.module.ts');
  assert(fs.existsSync(appDir), `App not found: ${appDir}`);
  assert(fs.existsSync(appModulePath), `Missing ${appModulePath}`);

  const moduleDirName = toKebabCase(moduleRawName);
  const classBaseName = toPascalCase(moduleRawName);
  const moduleClassName = `${classBaseName}Module`;
  const controllerClassName = `${classBaseName}Controller`;
  const serviceClassName = `${classBaseName}Service`;
  const repositoryClassName = `${classBaseName}Repository`;

  const targetModuleDir = path.join(appDir, 'src', 'modules', moduleDirName);
  if (fs.existsSync(targetModuleDir)) {
    console.log(
      `Module already exists: apps/${appName}/src/modules/${moduleDirName}`,
    );
    process.exit(0);
  }
  ensureDirSync(targetModuleDir);

  // Templates
  const controllerTs = `import { Controller } from '@nestjs/common';

@Controller('${moduleDirName}')
export class ${controllerClassName} {}
`;

  const serviceTs = `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${serviceClassName} {}
`;

  const repoTs = `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${repositoryClassName} {}
`;

  const mapperTs = `export const map${classBaseName}ToDto = (entity: unknown) => entity;
`;

  const dtoTs = `export interface ${classBaseName}Dto {}
`;

  const moduleTs = `import { Module } from '@nestjs/common';
import { ${controllerClassName} } from './${moduleDirName}.controller';
import { ${serviceClassName} } from './${moduleDirName}.service';
import { ${repositoryClassName} } from './${moduleDirName}.repo';

@Module({
  imports: [],
  controllers: [${controllerClassName}],
  providers: [${serviceClassName}, ${repositoryClassName}],
  exports: [${serviceClassName}, ${repositoryClassName}],
})
export class ${moduleClassName} {}
`;

  // Write files (idempotent per file)
  writeFileIfNotExists(
    path.join(targetModuleDir, `${moduleDirName}.controller.ts`),
    controllerTs,
  );
  writeFileIfNotExists(
    path.join(targetModuleDir, `${moduleDirName}.service.ts`),
    serviceTs,
  );
  writeFileIfNotExists(
    path.join(targetModuleDir, `${moduleDirName}.module.ts`),
    moduleTs,
  );
  writeFileIfNotExists(
    path.join(targetModuleDir, `${moduleDirName}.repo.ts`),
    repoTs,
  );
  writeFileIfNotExists(
    path.join(targetModuleDir, `${moduleDirName}.mapper.ts`),
    mapperTs,
  );
  writeFileIfNotExists(
    path.join(targetModuleDir, `${moduleDirName}.dto.ts`),
    dtoTs,
  );

  // Update apps/<app>/src/app.module.ts
  let content = fs.readFileSync(appModulePath, 'utf8');
  const importLine = `import { ${moduleClassName} } from './modules/${moduleDirName}/${moduleDirName}.module';`;
  if (!content.includes(importLine)) {
    // insert after last import
    const importRegex = /(import[^;]+;\s*)+/;
    const match = content.match(importRegex);
    if (match) {
      const lastImportBlock = match[0];
      content = content.replace(
        lastImportBlock,
        lastImportBlock + importLine + '\n',
      );
    } else {
      content = importLine + '\n' + content;
    }
  }

  // Ensure module added to imports array inside @Module({...})
  const moduleDecoratorRegex = /@Module\(\{[\s\S]*?\}\)/m;
  const decoratorMatch = content.match(moduleDecoratorRegex);
  assert(decoratorMatch, 'Could not find @Module decorator in app.module.ts');
  const decorator = decoratorMatch[0];

  const importsPropRegex = /(imports\s*:\s*\[)([\s\S]*?)(\])/m;
  if (importsPropRegex.test(decorator)) {
    const currentImports = decorator.replace(
      importsPropRegex,
      (m, p1, p2) => p2,
    );
    const isInImportsArray = new RegExp(
      `(^|[\n\r\s,])${moduleClassName}(?=\s*(,|$))`,
    ).test(currentImports);
    if (!isInImportsArray) {
      const newDecorator = decorator.replace(
        importsPropRegex,
        (m, p1, p2, p3) => {
          const trimmed = p2.trim();
          if (trimmed.length === 0) {
            return `${p1}${moduleClassName}${p3}`;
          }
          const needsComma = trimmed.endsWith(',') ? ' ' : ', ';
          return `${p1}${p2}${needsComma}${moduleClassName}${p3}`;
        },
      );
      content = content.replace(decorator, newDecorator);
    }
  } else {
    // Insert imports: [<Module>] just after @Module({
    const newDecorator = decorator.replace(
      /@Module\(\{/,
      (s) => `${s}\n  imports: [${moduleClassName}],`,
    );
    content = content.replace(decorator, newDecorator);
  }

  fs.writeFileSync(appModulePath, content, 'utf8');

  console.log(`✓ Created module: apps/${appName}/src/modules/${moduleDirName}`);
  console.log(`✓ Updated imports in apps/${appName}/src/app.module.ts`);
  console.log('Next:');
  console.log(`- Run: pnpm dev ${appName} (or npm run dev)`);
}

main();
