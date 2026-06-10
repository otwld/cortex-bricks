import { readFileSync, readdirSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, extname, join, relative } from 'node:path';

import ts from 'typescript';

const workspaceRoot = process.cwd();
const rootManifest = readJson('package.json');
const rootRanges = {
  ...rootManifest.dependencies,
  ...rootManifest.devDependencies,
};
const nxJson = readJson('nx.json');
const builtinSpecifiers = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
const typeCompanions = {
  bcrypt: '@types/bcrypt',
  'cookie-parser': '@types/cookie-parser',
  express: '@types/express',
  nodemailer: '@types/nodemailer',
  'passport-github2': '@types/passport-github2',
  'passport-google-oauth20': '@types/passport-google-oauth20',
  'passport-jwt': '@types/passport-jwt',
  'passport-local': '@types/passport-local',
  supertest: '@types/supertest',
};
const errors = [];
const projectFiles = walk('packages').filter((file) => file.endsWith('/project.json'));
const workspacePackageNames = new Set(
  projectFiles.map((projectFile) => readJson(join(dirname(projectFile), 'package.json')).name),
);

if (!nxJson.targetDefaults?.build?.dependsOn?.includes('^build')) {
  errors.push('nx.json: targetDefaults.build.dependsOn must include ^build.');
}

for (const projectFile of projectFiles.sort()) {
  auditProject(projectFile);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Audited ${projectFiles.length} brick manifests.`);
}

function auditProject(projectFile) {
  const projectRoot = dirname(projectFile);
  const manifestPath = join(projectRoot, 'package.json');
  const project = readJson(projectFile);
  const manifest = readJson(manifestPath);
  const runtime = {
    ...manifest.dependencies,
    ...manifest.peerDependencies,
    ...manifest.optionalDependencies,
  };
  const dev = manifest.devDependencies ?? {};
  const all = { ...runtime, ...dev };

  for (const [section, dependencies] of Object.entries({
    dependencies: manifest.dependencies,
    peerDependencies: manifest.peerDependencies,
    optionalDependencies: manifest.optionalDependencies,
    devDependencies: manifest.devDependencies,
  })) {
    for (const [name, range] of Object.entries(dependencies ?? {})) {
      if (workspacePackageNames.has(name)) {
        if (!range.startsWith('workspace:')) {
          errors.push(`${manifest.name}: ${section}.${name} must use the workspace: protocol.`);
        }
        continue;
      }
      requireRootRange(manifest.name, section, name, range);
    }
  }

  requireDependency(manifest, all, 'nx', 'dev', 'Nx project');
  requireDependency(manifest, all, 'typescript', 'dev', 'TypeScript project');

  for (const plugin of nxJson.plugins ?? []) {
    const name = typeof plugin === 'string' ? plugin : plugin.plugin;
    if (typeof name === 'string') {
      requireDependency(manifest, all, name, 'dev', 'nx.json plugin');
    }
  }

  for (const target of Object.values(project.targets ?? {})) {
    const executor = target.executor;
    if (typeof executor === 'string' && !executor.startsWith('nx:')) {
      const name = dependencyName(executor.split(':')[0]);
      if (name !== undefined) {
        requireDependency(manifest, all, name, 'dev', `executor ${executor}`);
      }
    }
    if (typeof executor === 'string' && executor.startsWith('@nx/angular:')) {
      for (const name of ['@angular-devkit/build-angular', '@angular/build', '@angular/compiler-cli', 'ng-packagr']) {
        requireDependency(manifest, all, name, 'dev', `executor ${executor}`);
      }
    }
    if (executor === '@nx/eslint:lint') {
      for (const name of ['eslint', ...(hasTag(project, 'framework:ng') ? ['angular-eslint'] : [])]) {
        requireDependency(manifest, all, name, 'dev', `executor ${executor}`);
      }
    }
  }

  for (const file of walk(projectRoot)) {
    if (file === manifestPath || file === projectFile) continue;
    if (isScript(file)) {
      for (const specifier of importedSpecifiers(file)) {
        const category = isRuntimeSource(file) ? 'runtime' : 'dev';
        const dependencies = category === 'runtime' ? runtime : all;
        const name = dependencyName(specifier);
        if (name !== undefined && !isOwnPackageImport(manifest.name, specifier)) {
          requireDependency(manifest, dependencies, name, category, relative(workspaceRoot, file));
        }
      }
    }
    if (file.endsWith('.json') && file.includes('tsconfig')) {
      const config = ts.readConfigFile(file, ts.sys.readFile).config;
      for (const typeName of config?.compilerOptions?.types ?? []) {
        const name = typeName === 'node' ? '@types/node' : dependencyName(typeName);
        if (name !== undefined) {
          requireDependency(manifest, all, name, 'dev', relative(workspaceRoot, file));
        }
      }
    }
  }

  for (const [dependency, companion] of Object.entries(typeCompanions)) {
    if (all[dependency] !== undefined) {
      requireDependency(manifest, all, companion, 'dev', `declarations for ${dependency}`);
    }
  }
}

function requireRootRange(project, section, name, range) {
  const rootRange = rootRanges[name];
  if (rootRange === undefined) {
    errors.push(`${project}: ${section}.${name} has no root workspace range.`);
  } else if (range !== rootRange) {
    errors.push(`${project}: ${section}.${name} uses ${range}; root workspace uses ${rootRange}.`);
  }
}

function requireDependency(manifest, dependencies, name, category, reason) {
  if (dependencies[name] === undefined) {
    errors.push(`${manifest.name}: missing ${category} dependency ${name} (${reason}).`);
  }
}

function hasTag(project, tag) {
  return (project.tags ?? []).includes(tag);
}

function importedSpecifiers(file) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const specifiers = [];
  visit(source);
  return specifiers;

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
}

function dependencyName(specifier) {
  if (
    builtinSpecifiers.has(specifier) ||
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('#')
  ) {
    return undefined;
  }
  return specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
}

function isOwnPackageImport(packageName, specifier) {
  return specifier === packageName || specifier.startsWith(`${packageName}/`);
}

function isRuntimeSource(file) {
  return (
    file.includes('/src/') &&
    !file.match(/\.(?:spec|test)\.[cm]?[jt]s$/) &&
    !file.endsWith('.test-d.ts') &&
    !file.endsWith('/test-setup.ts')
  );
}

function isScript(file) {
  return ['.cjs', '.cts', '.js', '.mjs', '.mts', '.ts'].includes(extname(file));
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${file}: ${error.message}`);
    return {};
  }
}

function walk(root, files = []) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (['.git', '.nx', 'dist', 'node_modules'].includes(entry.name)) continue;
    const file = join(root, entry.name);
    if (entry.isDirectory()) walk(file, files);
    else files.push(file);
  }
  return files;
}
