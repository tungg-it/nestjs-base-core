#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
};

function exitWithUsage(message) {
  if (message) console.error(`${colors.red}❌ ${message}${colors.reset}`);
  console.error('Usage: node script/create-module.js <app> <module>');
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`${colors.red}❌ ${message}${colors.reset}`);
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

function getLineIndent(text, index) {
  const lineStart = text.lastIndexOf('\n', index) + 1;
  const line = text.slice(lineStart);
  const match = line.match(/^\s*/);
  return match ? match[0] : '';
}

function findMatchingDelimiter(text, startIndex, openChar, closeChar) {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inSingleQuote || inDoubleQuote || inTemplateString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (inSingleQuote && char === "'") {
        inSingleQuote = false;
      } else if (inDoubleQuote && char === '"') {
        inDoubleQuote = false;
      } else if (inTemplateString && char === '`') {
        inTemplateString = false;
      }

      continue;
    }

    if (char === '/' && nextChar === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }

    if (char === '`') {
      inTemplateString = true;
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function addModuleToAppModuleImports(content, moduleClassName) {
  const decoratorStart = content.indexOf('@Module(');
  assert(
    decoratorStart !== -1,
    'Could not find @Module decorator in app.module.ts',
  );

  const objectStart = content.indexOf('{', decoratorStart);
  assert(objectStart !== -1, 'Could not find @Module object in app.module.ts');

  const objectEnd = findMatchingDelimiter(content, objectStart, '{', '}');
  assert(objectEnd !== -1, 'Could not parse @Module object in app.module.ts');

  const objectBody = content.slice(objectStart + 1, objectEnd);
  const importsMatch = objectBody.match(/^([ \t]*)imports\s*:\s*\[/m);

  if (!importsMatch) {
    const objectIndent = getLineIndent(content, objectStart);
    const propertyIndent = `${objectIndent}  `;
    const itemIndent = `${propertyIndent}  `;
    const insertion = `\n${propertyIndent}imports: [\n${itemIndent}${moduleClassName},\n${propertyIndent}],`;

    return (
      content.slice(0, objectStart + 1) +
      insertion +
      content.slice(objectStart + 1)
    );
  }

  const propertyStart = objectStart + 1 + importsMatch.index;
  const arrayStart = content.indexOf('[', propertyStart);
  const arrayEnd = findMatchingDelimiter(content, arrayStart, '[', ']');
  assert(arrayEnd !== -1, 'Could not parse imports array in app.module.ts');

  const arrayContent = content.slice(arrayStart + 1, arrayEnd);
  const isInImportsArray = new RegExp(`\\b${moduleClassName}\\b`).test(
    arrayContent,
  );

  if (isInImportsArray) {
    return content;
  }

  let newArrayContent;
  if (arrayContent.trim().length === 0) {
    const propertyIndent = importsMatch[1];
    const itemIndent = `${propertyIndent}  `;
    newArrayContent = `\n${itemIndent}${moduleClassName},\n${propertyIndent}`;
  } else if (arrayContent.includes('\n')) {
    const propertyIndent = importsMatch[1];
    const itemIndent = `${propertyIndent}  `;
    const trimmedEnd = arrayContent.replace(/\s*$/, '');
    const separator = /,\s*$/.test(trimmedEnd) ? '' : ',';
    newArrayContent = `${trimmedEnd}${separator}\n${itemIndent}${moduleClassName},\n${propertyIndent}`;
  } else {
    const trimmed = arrayContent.trim();
    const separator = trimmed.endsWith(',') ? ' ' : ', ';
    newArrayContent = `${trimmed}${separator}${moduleClassName}`;
  }

  return (
    content.slice(0, arrayStart + 1) + newArrayContent + content.slice(arrayEnd)
  );
}

function main() {
  try {
    const repoRoot = path.resolve(__dirname, '../../');
    const app = process.argv[2];
    const mod = process.argv[3];
    if (!app || !mod) exitWithUsage('Missing <app> or <module>.');

    const appName = app.trim();
    const moduleRawName = mod.trim();
    assert(
      /^[a-zA-Z0-9\-]+$/.test(appName),
      'App must be alphanumeric or dash.',
    );
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
        `${colors.red}❌ Module already exists: apps/${appName}/src/modules/${moduleDirName}${colors.reset}`,
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

    // Write files
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

    // Update app.module.ts
    let content = fs.readFileSync(appModulePath, 'utf8');
    const importLine = `import { ${moduleClassName} } from './modules/${moduleDirName}/${moduleDirName}.module';`;
    if (!content.includes(importLine)) {
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

    content = addModuleToAppModuleImports(content, moduleClassName);

    fs.writeFileSync(appModulePath, content, 'utf8');

    console.log(
      `${colors.green}✅ Created module: apps/${appName}/src/modules/${moduleDirName}${colors.reset}`,
    );
    console.log(
      `${colors.green}✅ Updated imports in apps/${appName}/src/app.module.ts${colors.reset}`,
    );
    console.log('Next:');
    console.log(`- Run: pnpm dev ${appName} (or npm run dev)`);
  } catch (err) {
    console.error(`${colors.red}❌ Error: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
