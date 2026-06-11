#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import ts from 'typescript';

/**
 * Audits that each repository-owned Angular component or directive has a
 * colocated Storybook story. This intentionally does not generate stories.
 */
const ROOTS = ['apps', 'packages', 'tools'];
const IGNORED_DIRECTORIES = new Set(['.git', '.nx', 'coverage', 'dist', 'node_modules', 'tmp']);
const DECORATOR_NAMES = new Set(['Component', 'Directive']);
const STORY_SUFFIX = '.stories.ts';

function walkFiles(directory, files = []) {
  for (const child of readdirSync(directory)) {
    if (IGNORED_DIRECTORIES.has(child)) {
      continue;
    }

    const path = join(directory, child);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      walkFiles(path, files);
      continue;
    }

    files.push(path);
  }

  return files;
}

function isEligibleSource(path) {
  if (!path.endsWith('.ts')) {
    return false;
  }

  const fileName = basename(path);

  return !(
    fileName.endsWith('.d.ts') ||
    fileName.endsWith('.spec.ts') ||
    fileName.endsWith('.stories.ts') ||
    fileName.endsWith('.test-d.ts') ||
    fileName.endsWith('.test.ts')
  );
}

function decorators(node) {
  return ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];
}

function decoratorName(decorator) {
  const expression = decorator.expression;

  if (ts.isCallExpression(expression)) {
    const target = expression.expression;

    return ts.isIdentifier(target) ? target.text : undefined;
  }

  return ts.isIdentifier(expression) ? expression.text : undefined;
}

function angularDeclarations() {
  return ROOTS.filter((root) => existsSync(root))
    .flatMap((root) => walkFiles(root))
    .filter(isEligibleSource)
    .flatMap((sourcePath) => {
      const sourceText = readFileSync(sourcePath, 'utf8');
      const sourceFile = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true);
      const declarations = [];

      for (const statement of sourceFile.statements) {
        if (!ts.isClassDeclaration(statement) || !statement.name) {
          continue;
        }

        for (const decorator of decorators(statement)) {
          const kind = decoratorName(decorator);

          if (!kind || !DECORATOR_NAMES.has(kind)) {
            continue;
          }

          declarations.push({
            className: statement.name.text,
            kind,
            sourcePath,
          });
        }
      }

      return declarations;
    })
    .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
}

function storyPath(sourcePath) {
  return sourcePath.replace(/\.ts$/, STORY_SUFFIX);
}

const declarations = angularDeclarations();
const missingDeclarations = declarations.filter((declaration) => !existsSync(storyPath(declaration.sourcePath)));

if (missingDeclarations.length > 0) {
  console.error(
    `Missing Storybook stories for ${missingDeclarations.length} of ${declarations.length} eligible Angular declaration file(s):`,
  );
  console.error(
    missingDeclarations
      .slice(0, 200)
      .map((declaration) => relative(process.cwd(), declaration.sourcePath))
      .join('\n'),
  );

  if (missingDeclarations.length > 200) {
    console.error(`...and ${missingDeclarations.length - 200} more.`);
  }

  process.exit(1);
}

console.log(`Audited ${declarations.length} Angular declaration story file(s).`);
