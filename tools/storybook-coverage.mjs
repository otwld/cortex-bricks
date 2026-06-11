#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';

/**
 * Storybook coverage for source files means every non-test TypeScript file in
 * the repository-owned app, package, and tool roots has either a colocated
 * source-mirror MDX page or a colocated story.
 */
const ROOTS = ['apps', 'packages', 'tools'];
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.nx',
  'coverage',
  'dist',
  'node_modules',
  'tmp',
]);
const STORY_EXTENSIONS = ['.stories.ts', '.stories.tsx', '.stories.js', '.stories.jsx'];
const ACRONYMS = new Map([
  ['ai', 'AI'],
  ['api', 'API'],
  ['casl', 'CASL'],
  ['cdk', 'CDK'],
  ['css', 'CSS'],
  ['dto', 'DTO'],
  ['dtos', 'DTOs'],
  ['gfm', 'GFM'],
  ['graphql', 'GraphQL'],
  ['html', 'HTML'],
  ['http', 'HTTP'],
  ['id', 'ID'],
  ['io', 'IO'],
  ['json', 'JSON'],
  ['jwt', 'JWT'],
  ['mdx', 'MDX'],
  ['msw', 'MSW'],
  ['ng', 'Angular'],
  ['nx', 'Nx'],
  ['oauth', 'OAuth'],
  ['oidc', 'OIDC'],
  ['sdk', 'SDK'],
  ['smtp', 'SMTP'],
  ['ts', 'TS'],
  ['tus', 'TUS'],
  ['ui', 'UI'],
  ['url', 'URL'],
  ['ws', 'WebSocket'],
]);
const PACKAGE_LABELS = new Map([
  ['ai', 'AI'],
  ['auth', 'Auth'],
  ['chat', 'Chat'],
  ['dashboard', 'Dashboard'],
  ['databases', 'Databases'],
  ['feature-flags', 'Feature Flags'],
  ['mail', 'Mail'],
  ['sdk', 'SDK'],
  ['storage', 'Storage'],
  ['storybook', 'Storybook'],
  ['tanstack', 'TanStack'],
  ['ui', 'UI'],
  ['users', 'Users'],
  ['websocket', 'WebSocket'],
]);
const RUNTIME_LABELS = new Map([
  ['nest', 'NestJS'],
  ['ng', 'Angular'],
  ['ts', 'TS'],
]);

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

  return [
    `${withoutExtension}.mdx`,
    ...STORY_EXTENSIONS.map((extension) => `${withoutExtension}${extension}`),
  ];
}

function hasStorybookArtifact(sourcePath) {
  return storybookArtifactPaths(sourcePath).some((artifactPath) => existsSync(artifactPath));
}

function splitIdentifier(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
}

function formatWord(word) {
  const lower = word.toLowerCase();
  const acronym = ACRONYMS.get(lower);

  if (acronym) {
    return acronym;
  }

  return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
}

function formatLabel(value) {
  const words = splitIdentifier(value);

  if (words.length === 0) {
    return value;
  }

  return words.map(formatWord).join(' ');
}

function camelCase(value) {
  const words = splitIdentifier(value);

  return words
    .map((word, index) => {
      const formatted = formatWord(word).replace(/[^A-Za-z0-9]/g, '');

      if (index === 0) {
        return `${formatted.slice(0, 1).toLowerCase()}${formatted.slice(1)}`;
      }

      return formatted;
    })
    .join('');
}

function sourceBaseName(sourcePath) {
  return basename(sourcePath, '.ts');
}

function sourceHeading(sourcePath) {
  const baseName = sourceBaseName(sourcePath);

  return baseName === 'index' ? 'Public API' : formatLabel(baseName);
}

function packageTitleParts(parts) {
  const [, packageName, runtimeName, ...rest] = parts;
  const packageLabel = PACKAGE_LABELS.get(packageName) ?? formatLabel(packageName);
  const runtimeLabel = RUNTIME_LABELS.get(runtimeName) ?? formatLabel(runtimeName);
  const srcIndex = rest.indexOf('src');
  const entrypointParts = srcIndex > 0 ? rest.slice(0, srcIndex) : [];
  const afterSrc = srcIndex >= 0 ? rest.slice(srcIndex + 1) : rest;
  const fileName = afterSrc.at(-1) ?? parts.at(-1);
  const directories = afterSrc.slice(0, -1).filter((segment) => segment !== 'lib');
  const titleParts = ['Toolkit', `${runtimeLabel} ${packageLabel}`];

  titleParts.push(...entrypointParts.map(formatLabel));

  if (srcIndex === -1) {
    titleParts.push('Tooling');
  } else if (fileName === 'index.ts' && afterSrc.length === 1) {
    titleParts.push('Package Entry');
  } else if (fileName === 'index.ts' && afterSrc.length === 2 && afterSrc[0] === 'lib') {
    titleParts.push('Library Entry');
  } else if (directories.length > 0) {
    titleParts.push(...directories.map(formatLabel));
  } else {
    titleParts.push('References');
  }

  titleParts.push(sourceHeading(fileName));

  return titleParts;
}

function appTitleParts(parts) {
  const [, appName, ...rest] = parts;
  const srcIndex = rest.indexOf('src');
  const afterSrc = srcIndex >= 0 ? rest.slice(srcIndex + 1) : rest;
  const fileName = afterSrc.at(-1) ?? parts.at(-1);
  const directories = afterSrc.slice(0, -1);
  const titleParts = ['Applications', formatLabel(appName)];

  if (srcIndex === -1) {
    titleParts.push('Tooling');
  } else if (directories.length > 0) {
    titleParts.push(...directories.map(formatLabel));
  } else {
    titleParts.push('Runtime');
  }

  titleParts.push(sourceHeading(fileName));

  return titleParts;
}

function toolTitleParts(parts) {
  const [, toolArea, ...rest] = parts;
  const fileName = rest.at(-1) ?? parts.at(-1);
  const directories = rest.slice(0, -1);
  const titleParts = ['Tooling', formatLabel(toolArea)];

  if (directories.length > 0) {
    titleParts.push(...directories.map(formatLabel));
  } else {
    titleParts.push('References');
  }

  titleParts.push(sourceHeading(fileName));

  return titleParts;
}

function storybookTitle(sourcePath) {
  const parts = sourcePath.split(sep);

  if (parts[0] === 'packages') {
    return packageTitleParts(parts).join('/');
  }

  if (parts[0] === 'tools') {
    return toolTitleParts(parts).join('/');
  }

  return appTitleParts(parts).join('/');
}

function mdxName(sourcePath) {
  return `${camelCase(sourcePath.replace(/\.ts$/, ''))}Source`;
}

function createMdxContent(sourcePath) {
  const sourceFileName = basename(sourcePath);
  const title = storybookTitle(sourcePath);
  const heading = sourceHeading(sourcePath);
  const name = mdxName(sourcePath);
  const repoPath = relative(process.cwd(), sourcePath);

  return `import { Meta, Source } from '@storybook/addon-docs/blocks';
import sourceCode from 'source-loader:./${sourceFileName}';

<Meta title="${title}" name="${name}" />

# ${heading}

Source mirror for \`${repoPath}\`.

<Source code={sourceCode} language="ts" />
`;
}

function eligibleSources() {
  return ROOTS
    .filter((root) => existsSync(root))
    .flatMap((root) => walkFiles(root))
    .filter(isEligibleSource)
    .sort();
}

function mdxFiles() {
  return ROOTS
    .filter((root) => existsSync(root))
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
          .join('\n\n')
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

if (shouldWrite) {
  for (const sourcePath of missingSources) {
    const mdxPath = sourcePath.replace(/\.ts$/, '.mdx');
    mkdirSync(dirname(mdxPath), { recursive: true });
    writeFileSync(mdxPath, createMdxContent(sourcePath));
  }

  console.log(`Generated ${missingSources.length} Storybook source mirror page(s).`);
}

const missingAfterWrite = sources.filter((sourcePath) => !hasStorybookArtifact(sourcePath));

if (missingAfterWrite.length > 0) {
  console.error(
    `Missing Storybook coverage for ${missingAfterWrite.length} of ${sources.length} eligible TypeScript source file(s):`
  );
  console.error(missingAfterWrite.slice(0, 200).join('\n'));

  if (missingAfterWrite.length > 200) {
    console.error(`...and ${missingAfterWrite.length - 200} more.`);
  }

  process.exit(1);
}

validateMdxMetadata();

console.log(`Audited ${sources.length} Storybook-covered TypeScript source file(s).`);
