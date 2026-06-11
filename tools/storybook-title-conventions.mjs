#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

import { storybookTitle } from './storybook-title-utils.mjs';

const ROOTS = ['apps', 'packages', 'tools'];
const IGNORED_DIRECTORIES = new Set(['.git', '.nx', 'coverage', 'dist', 'node_modules', 'tmp']);
const STORY_FILE_PATTERN = /\.stories\.(?:ts|tsx|js|jsx)$/;

/**
 * Read-only Storybook identity audit. Title and name fixes are made manually so
 * docs metadata stays meaningful instead of filesystem-derived.
 */

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

function storybookFiles() {
  return ROOTS.filter((root) => existsSync(root))
    .flatMap((root) => walkFiles(root))
    .filter((path) => STORY_FILE_PATTERN.test(path) || path.endsWith('.mdx'))
    .sort();
}

function unwrapExpression(expression) {
  let current = expression;

  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isTypeAssertionExpression(current))
  ) {
    current = current.expression;
  }

  return current;
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return undefined;
}

function objectLiteralTitle(objectLiteral) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property) || propertyNameText(property.name) !== 'title') {
      continue;
    }

    const initializer = unwrapExpression(property.initializer);

    if (initializer && ts.isStringLiteralLike(initializer)) {
      return initializer.text;
    }
  }

  return undefined;
}

function storyMetadata(path, content) {
  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const objectLiteralsByName = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue;
      }

      const initializer = unwrapExpression(declaration.initializer);

      if (initializer && ts.isObjectLiteralExpression(initializer)) {
        objectLiteralsByName.set(declaration.name.text, initializer);
      }
    }
  }

  for (const statement of sourceFile.statements) {
    if (!ts.isExportAssignment(statement)) {
      continue;
    }

    const expression = unwrapExpression(statement.expression);
    const objectLiteral = ts.isIdentifier(expression)
      ? objectLiteralsByName.get(expression.text)
      : expression && ts.isObjectLiteralExpression(expression)
        ? expression
        : undefined;
    const title = objectLiteral ? objectLiteralTitle(objectLiteral) : undefined;

    return title ? { title } : undefined;
  }

  const metaObject = objectLiteralsByName.get('meta');
  const title = metaObject ? objectLiteralTitle(metaObject) : undefined;

  return title ? { title } : undefined;
}

function mdxMetadata(content) {
  const metaMatch = content.match(/<Meta\b[\s\S]*?>/);

  if (!metaMatch) {
    return undefined;
  }

  const meta = metaMatch[0];
  const titleMatch = meta.match(/\btitle=(['"])(.*?)\1/);
  const nameMatch = meta.match(/\bname=(['"])(.*?)\1/);

  return {
    meta,
    metaEnd: metaMatch.index + meta.length,
    metaStart: metaMatch.index,
    name: nameMatch?.[2],
    title: titleMatch?.[2],
    titleEnd: titleMatch ? metaMatch.index + titleMatch.index + titleMatch[0].length : undefined,
    titleQuote: titleMatch?.[1],
    titleStart: titleMatch ? metaMatch.index + titleMatch.index : undefined,
  };
}

function storyExportNames(content) {
  const exports = [];
  const exportPattern = /\bexport\s+const\s+([A-Za-z_$][\w$]*)\b/g;

  for (const match of content.matchAll(exportPattern)) {
    exports.push(match[1]);
  }

  return exports;
}

function reportFailures(label, failures) {
  if (failures.length === 0) {
    return;
  }

  console.error(`${label} (${failures.length}):`);
  console.error(failures.slice(0, 80).join('\n'));

  if (failures.length > 80) {
    console.error(`...and ${failures.length - 80} more.`);
  }
}

const files = storybookFiles();
const mismatches = [];
const missingMetadata = [];
const storyIds = new Map();
const duplicateStories = [];

for (const path of files) {
  const content = readFileSync(path, 'utf8');
  const expectedTitle = storybookTitle(path);
  const isStory = STORY_FILE_PATTERN.test(path);
  const metadata = isStory ? storyMetadata(path, content) : mdxMetadata(content);

  if (!metadata || !metadata.title) {
    missingMetadata.push(relative(process.cwd(), path));
    continue;
  }

  if (metadata?.title !== expectedTitle) {
    mismatches.push(
      `${relative(process.cwd(), path)}\n  expected: ${expectedTitle}\n  actual:   ${metadata?.title ?? '<missing>'}`,
    );
  }

  if (!isStory || !metadata?.title) {
    continue;
  }

  for (const exportName of storyExportNames(content)) {
    const key = `${expectedTitle}\0${exportName}`;
    const existing = storyIds.get(key);

    if (existing) {
      duplicateStories.push(`${existing}\n${relative(process.cwd(), path)}\n  duplicate export: ${exportName}`);
      continue;
    }

    storyIds.set(key, relative(process.cwd(), path));
  }
}

const failed = missingMetadata.length > 0 || mismatches.length > 0 || duplicateStories.length > 0;

if (failed) {
  reportFailures('Missing Storybook title metadata', missingMetadata);
  reportFailures('Non-conforming Storybook title metadata', mismatches);
  reportFailures('Duplicate Storybook title/export identities', duplicateStories);
  process.exit(1);
}

console.log(`Audited ${files.length} Storybook title metadata file(s).`);
