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
  if (message) {
    console.error(`${colors.red}❌ ${message}${colors.reset}`);
  }
  console.error('Usage: node script/core/create-app.js <app-name>');
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

function readJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function writeJson(filePath, data) {
  const content = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
}

function buildMainTemplate(appName) {
  return `import { AppModule } from '@apps/${appName}/app.module';
import { startApp } from '@libs/core';

startApp(AppModule, {
  appName: '${appName}',
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
`;
}

function buildAppModuleTemplate(appName) {
  return `import { Module } from '@nestjs/common';
import { DefaultRouteController, commonModules } from '@libs/core';

@Module({
  imports: [
    ...commonModules({ appName: '${appName}' }),
  ],
  controllers: [DefaultRouteController],
  providers: [],
})
export class AppModule {}
`;
}

function main() {
  const repoRoot = path.resolve(__dirname, '../../');
  const appName = process.argv[2];
  if (!appName) exitWithUsage('Missing <app-name>.');

  const safeName = appName.trim();
  assert(
    /^[a-z][a-z0-9-]*$/.test(safeName),
    'App name must match ^[a-z][a-z0-9-]*$',
  );

  const newAppDir = path.join(repoRoot, 'apps', safeName);
  if (fs.existsSync(newAppDir)) {
    console.error(
      `${colors.red}❌ App already exists: apps/${safeName} (skipping creation)${colors.reset}`,
    );
    process.exit(0);
  }

  try {
    // 1) Create minimal structure
    const newSrcDir = path.join(newAppDir, 'src');
    ensureDirSync(newSrcDir);

    // 2) main.ts & app.module.ts
    const mainTs = path.join(newSrcDir, 'main.ts');
    const appModuleTs = path.join(newSrcDir, 'app.module.ts');
    const tsconfigApp = path.join(newAppDir, 'tsconfig.app.json');

    fs.writeFileSync(mainTs, buildMainTemplate(safeName), 'utf8');
    fs.writeFileSync(appModuleTs, buildAppModuleTemplate(safeName), 'utf8');

    // 3) tsconfig.app.json
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

    // 4) nest-cli.json
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
      console.warn(
        `${colors.red}❌ Warning: could not update nest-cli.json: ${e.message}${colors.reset}`,
      );
    }

    // 5) tsconfig.json paths
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
      console.warn(
        `${colors.red}❌ Warning: could not update tsconfig.json: ${e.message}${colors.reset}`,
      );
    }

    // 6) Success message
    console.log(
      `${colors.green}✅ Created app apps/${safeName}${colors.reset}`,
    );
    console.log('Next steps:');
    console.log(`- Start the app: pnpm dev ${safeName}`);
    console.log(`- Or build: pnpm build ${safeName}`);
  } catch (err) {
    console.error(`${colors.red}❌ Error: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
