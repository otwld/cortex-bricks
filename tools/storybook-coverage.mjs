#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

/**
 * Storybook coverage for source files means every non-test TypeScript file in
 * the repository-owned app, package, and tool roots has either a colocated
 * source-mirror MDX page or a colocated story.
 *
 * This audit is intentionally read-only; source MDX pages are maintained
 * manually so naming, package labels, import examples, and notes stay reviewed.
 */
const ROOTS = ['apps', 'packages', 'tools'];
const IGNORED_DIRECTORIES = new Set(['.git', '.nx', 'coverage', 'dist', 'node_modules', 'tmp']);
const STORY_EXTENSIONS = ['.stories.ts', '.stories.tsx', '.stories.js', '.stories.jsx'];
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

function storybookArtifactPaths(sourcePath) {
  const withoutExtension = sourcePath.replace(/\.ts$/, '');

  return [`${withoutExtension}.mdx`, ...STORY_EXTENSIONS.map((extension) => `${withoutExtension}${extension}`)];
}

function hasStorybookArtifact(sourcePath) {
  return storybookArtifactPaths(sourcePath).some((artifactPath) => existsSync(artifactPath));
}

function eligibleSources() {
  return ROOTS.filter((root) => existsSync(root))
    .flatMap((root) => walkFiles(root))
    .filter(isEligibleSource)
    .sort();
}

function mdxFiles() {
  return ROOTS.filter((root) => existsSync(root))
    .flatMap((root) => walkFiles(root))
    .filter((path) => path.endsWith('.mdx'))
    .sort();
}

function mdxMetadata(path) {
  const content = readFileSync(path, 'utf8');
  const meta = content.match(/<Meta\s+[^>]*>/)?.[0];
  const title = meta?.match(/\btitle=(["'])(.*?)\1/)?.[2];
  const name = meta?.match(/\bname=(["'])(.*?)\1/)?.[2];

  if (!title || !name) {
    return undefined;
  }

  return { name, title };
}

function validateMdxMetadata() {
  const missingMetadata = [];
  const pathsByIdentity = new Map();

  for (const path of mdxFiles()) {
    const metadata = mdxMetadata(path);

    if (!metadata) {
      missingMetadata.push(path);
      continue;
    }

    const key = `${metadata.title}\0${metadata.name}`;
    const paths = pathsByIdentity.get(key) ?? [];

    paths.push(path);
    pathsByIdentity.set(key, paths);
  }

  const duplicateIdentities = [...pathsByIdentity.values()].filter((paths) => paths.length > 1);

  if (missingMetadata.length > 0 || duplicateIdentities.length > 0) {
    if (missingMetadata.length > 0) {
      console.error(`Missing Storybook <Meta title name> metadata in ${missingMetadata.length} MDX file(s):`);
      console.error(missingMetadata.slice(0, 50).join('\n'));

      if (missingMetadata.length > 50) {
        console.error(`...and ${missingMetadata.length - 50} more.`);
      }
    }

    if (duplicateIdentities.length > 0) {
      console.error(`Duplicate Storybook MDX title/name identities in ${duplicateIdentities.length} group(s):`);
      console.error(
        duplicateIdentities
          .slice(0, 50)
          .map((paths) => paths.join('\n'))
          .join('\n\n'),
      );

      if (duplicateIdentities.length > 50) {
        console.error(`...and ${duplicateIdentities.length - 50} more.`);
      }
    }

    process.exit(1);
  }
}

const sources = eligibleSources();
const missingSources = sources.filter((sourcePath) => !hasStorybookArtifact(sourcePath));

if (missingSources.length > 0) {
  console.error(
    `Missing Storybook coverage for ${missingSources.length} of ${sources.length} eligible TypeScript source file(s):`,
  );
  console.error(missingSources.slice(0, 200).join('\n'));

  if (missingSources.length > 200) {
    console.error(`...and ${missingSources.length - 200} more.`);
  }

  process.exit(1);
}

validateMdxMetadata();

console.log(`Audited ${sources.length} Storybook-covered TypeScript source file(s).`);
