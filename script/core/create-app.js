#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/*
  Create a new minimal Nest app in apps/<name> based on apps/api

  Usage:
    node script/create-app.js <app-name>

  This script will:
  - Create apps/<name>/src with only main.ts and app.module.ts
  - Replace "@apps/api/*" with "@apps/<name>/*" and set appName
  - Generate tsconfig.app.json with outDir ../../dist/apps/<name>
  - Update nest-cli.json to add a project entry for the new app
  - Update tsconfig.json to add a path alias @apps/<name>/*
*/

const fs = require('fs');
const path = require('path');

function exitWithUsage(message) {
  if (message) {
    console.error(message);
  }
  console.error('Usage: node script/create-app.js <app-name>');
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

function readJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function writeJson(filePath, data) {
  const content = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  const repoRoot = path.resolve(__dirname, '../../');
  const appName = process.argv[2];
  if (!appName) exitWithUsage('❌ Missing <app-name>.');

  const safeName = appName.trim();
  assert(
    /^[a-z][a-z0-9-]*$/.test(safeName),
    'App name must match ^[a-z][a-z0-9-]*$',
  );

  const apiAppDir = path.join(repoRoot, 'apps', 'api');
  console.log(apiAppDir);
  const newAppDir = path.join(repoRoot, 'apps', safeName);
  assert(fs.existsSync(apiAppDir), '❌ Base app apps/api not found.');
  if (fs.existsSync(newAppDir)) {
    console.log(`❌ App already exists: apps/${safeName} (skipping creation)`);
    process.exit(0);
  }

  // 1) Create minimal structure
  const newSrcDir = path.join(newAppDir, 'src');
  ensureDirSync(newSrcDir);

  // 2) Create main.ts and app.module.ts from api templates with replacements
  const apiMainPath = path.join(apiAppDir, 'src', 'main.ts');
  const apiAppModulePath = path.join(apiAppDir, 'src', 'app.module.ts');
  const mainTs = path.join(newSrcDir, 'main.ts');
  const appModuleTs = path.join(newSrcDir, 'app.module.ts');
  const tsconfigApp = path.join(newAppDir, 'tsconfig.app.json');

  const mainTemplate = fs
    .readFileSync(apiMainPath, 'utf8')
    .replace(/@apps\/api\//g, `@apps/${safeName}/`)
    .replace(/appName:\s*'api'/, `appName: '${safeName}'`);
  fs.writeFileSync(mainTs, mainTemplate, 'utf8');

  const appModuleTemplate = fs
    .readFileSync(apiAppModulePath, 'utf8')
    .replace(/@apps\/api\//g, `@apps/${safeName}/`);
  fs.writeFileSync(appModuleTs, appModuleTemplate, 'utf8');

  // 3) Write minimal tsconfig.app.json
  const tsCfg = {
    extends: '../../tsconfig.json',
    compilerOptions: {
      declaration: false,
      outDir: `../../dist/apps/${safeName}`,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', 'test', '**/*spec.ts'],
  };
  writeJson(tsconfigApp, tsCfg);

  // 3) Update nest-cli.json: add project entry
  const nestCliPath = path.join(repoRoot, 'nest-cli.json');
  try {
    const nestCli = readJson(nestCliPath);
    nestCli.projects = nestCli.projects || {};
    if (!nestCli.projects[safeName]) {
      nestCli.projects[safeName] = {
        type: 'application',
        root: `apps/${safeName}`,
        entryFile: 'main',
        sourceRoot: `apps/${safeName}/src`,
        compilerOptions: {
          tsConfigPath: `apps/${safeName}/tsconfig.app.json`,
        },
      };
    }
    writeJson(nestCliPath, nestCli);
  } catch (e) {
    console.warn('Warning: could not update nest-cli.json:', e.message);
  }

  // 4) Update tsconfig.json paths
  const tsconfigPath = path.join(repoRoot, 'tsconfig.json');
  try {
    const rootTsCfg = readJson(tsconfigPath);
    rootTsCfg.compilerOptions = rootTsCfg.compilerOptions || {};
    rootTsCfg.compilerOptions.paths = rootTsCfg.compilerOptions.paths || {};
    const alias = `@apps/${safeName}/*`;
    if (!rootTsCfg.compilerOptions.paths[alias]) {
      rootTsCfg.compilerOptions.paths[alias] = [`apps/${safeName}/src/*`];
    }
    writeJson(tsconfigPath, rootTsCfg);
  } catch (e) {
    console.warn('Warning: could not update tsconfig.json:', e.message);
  }

  console.log(`✓ Created app apps/${safeName}`);
  console.log('Next steps:');
  console.log(`- Start the app: pnpm dev ${safeName}`);
  console.log(`- Or build: pnpm build ${safeName}`);
}

main();
