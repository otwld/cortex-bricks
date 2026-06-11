#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { storybookTitle } from './storybook-title-utils.mjs';

const ROOTS = ['apps', 'packages', 'tools'];
const IGNORED_DIRECTORIES = new Set(['.git', '.nx', 'coverage', 'dist', 'node_modules', 'tmp']);
const STORY_FILE_PATTERN = /\.stories\.(?:ts|tsx|js|jsx)$/;
const shouldWrite = process.argv.includes('--write');

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

function storyMetadata(content) {
  const match = content.match(/\btitle:\s*(['"])(.*?)\1/);

  return match
    ? {
        end: match.index + match[0].length,
        quote: match[1],
        start: match.index,
        title: match[2],
      }
    : undefined;
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

function replaceStoryTitle(content, metadata, expectedTitle) {
  const quote = metadata.quote;

  return `${content.slice(0, metadata.start)}title: ${quote}${expectedTitle}${quote}${content.slice(metadata.end)}`;
}

function replaceMdxTitle(content, metadata, expectedTitle) {
  if (metadata.titleStart !== undefined && metadata.titleEnd !== undefined) {
    const quote = metadata.titleQuote ?? '"';

    return `${content.slice(0, metadata.titleStart)}title=${quote}${expectedTitle}${quote}${content.slice(
      metadata.titleEnd,
    )}`;
  }

  const insertAt = metadata.metaStart + '<Meta'.length;

  return `${content.slice(0, insertAt)} title="${expectedTitle}"${content.slice(insertAt)}`;
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
let updated = 0;

for (const path of files) {
  const content = readFileSync(path, 'utf8');
  const expectedTitle = storybookTitle(path);
  const isStory = STORY_FILE_PATTERN.test(path);
  const metadata = isStory ? storyMetadata(content) : mdxMetadata(content);

  if (!metadata || !metadata.title) {
    missingMetadata.push(relative(process.cwd(), path));

    if (!shouldWrite || !metadata) {
      continue;
    }
  }

  if (metadata?.title !== expectedTitle) {
    mismatches.push(
      `${relative(process.cwd(), path)}\n  expected: ${expectedTitle}\n  actual:   ${metadata?.title ?? '<missing>'}`,
    );
  }

  if (shouldWrite && metadata && metadata.title !== expectedTitle) {
    const nextContent = isStory
      ? replaceStoryTitle(content, metadata, expectedTitle)
      : replaceMdxTitle(content, metadata, expectedTitle);

    writeFileSync(path, nextContent);
    updated += 1;
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

if (shouldWrite) {
  console.log(`Updated ${updated} Storybook title metadata value(s).`);
}

const failed = !shouldWrite && (missingMetadata.length > 0 || mismatches.length > 0 || duplicateStories.length > 0);

if (failed) {
  reportFailures('Missing Storybook title metadata', missingMetadata);
  reportFailures('Non-conforming Storybook title metadata', mismatches);
  reportFailures('Duplicate Storybook title/export identities', duplicateStories);
  process.exit(1);
}

console.log(`Audited ${files.length} Storybook title metadata file(s).`);
