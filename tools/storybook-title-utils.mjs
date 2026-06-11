import { basename } from 'node:path';

const APP_TECHNOLOGIES = new Map([
  ['backend', 'nest'],
  ['documentation', 'storybook'],
  ['frontend', 'ng'],
]);

const IGNORED_SUBJECT_SEGMENTS = new Set([
  'abstracts',
  'adapters',
  'app',
  'config',
  'controllers',
  'decorators',
  'directives',
  'drivers',
  'dto',
  'dtos',
  'enums',
  'errors',
  'exceptions',
  'guards',
  'hooks',
  'interfaces',
  'interceptors',
  'internal',
  'lib',
  'models',
  'pipes',
  'providers',
  'schemas',
  'services',
  'src',
  'strategies',
  'templates',
  'tokens',
  'types',
  'utils',
]);

const STRIPPED_FILE_SUFFIXES = new Set(['component', 'directive', 'page']);
const STORY_FILE_PATTERN = /\.stories\.(?:ts|tsx|js|jsx)$/;

/**
 * Converts a path, class, or source identifier into one lowercase kebab segment.
 */
export function storybookTitleSegment(value) {
  return value
    .replace(STORY_FILE_PATTERN, '')
    .replace(/\.[cm]?[jt]sx?$/, '')
    .replace(/\.mdx$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part.toLowerCase())
    .join('-');
}

function stripDisplaySuffixes(segment) {
  const parts = segment.split('-');

  while (parts.length > 1 && STRIPPED_FILE_SUFFIXES.has(parts.at(-1))) {
    parts.pop();
  }

  return parts.join('-');
}

function cleanFileSegment(fileName) {
  const normalized = storybookTitleSegment(fileName);

  if (normalized === 'index') {
    return undefined;
  }

  return stripDisplaySuffixes(normalized);
}

function cleanDirectorySegment(directoryName) {
  const normalized = storybookTitleSegment(directoryName);

  if (!normalized || IGNORED_SUBJECT_SEGMENTS.has(normalized)) {
    return undefined;
  }

  return normalized;
}

function splitPath(path) {
  return path.split(/[\\/]+/).filter(Boolean);
}

function packageSubjectParts(rest) {
  const srcIndex = rest.indexOf('src');
  const entrypointParts = srcIndex > 0 ? rest.slice(0, srcIndex) : [];
  const afterSrc = srcIndex >= 0 ? rest.slice(srcIndex + 1) : rest;

  return [...entrypointParts, ...afterSrc];
}

function appSubjectParts(appName, rest) {
  const srcIndex = rest.indexOf('src');

  if (srcIndex >= 0) {
    return rest.slice(srcIndex + 1);
  }

  return rest;
}

function subjectParts(rawParts) {
  const cleaned = [];
  const skipped = [];

  rawParts.forEach((part, index) => {
    const isFile = index === rawParts.length - 1 && /\.[^.]+$/.test(basename(part));
    const cleanedPart = isFile ? cleanFileSegment(part) : cleanDirectorySegment(part);

    if (!cleanedPart) {
      const skippedPart = !isFile ? storybookTitleSegment(part) : undefined;

      if (skippedPart && !['app', 'lib', 'src'].includes(skippedPart)) {
        skipped.push(skippedPart);
      }

      return;
    }

    if (cleanedPart === cleaned.at(-1)) {
      return;
    }

    cleaned.push(cleanedPart);
  });

  if (cleaned.length === 0 && skipped.length > 0) {
    return [skipped.at(-1)];
  }

  return cleaned.length > 0 ? cleaned : ['public-api'];
}

/**
 * Derives the strict Storybook title for a repository story or MDX artifact.
 *
 * The resulting title follows `<feature>/<technology>/<subject...>`, strips
 * organization scope, technology prefixes, and structural source folders, and
 * keeps every segment lowercase kebab-case.
 */
export function storybookTitle(path) {
  const parts = splitPath(path);
  const [root] = parts;

  if (root === 'packages') {
    const [, packageName, technology, ...rest] = parts;
    const feature = storybookTitleSegment(packageName);

    return [feature, storybookTitleSegment(technology), ...subjectParts(packageSubjectParts(rest))].join('/');
  }

  if (root === 'apps') {
    const [, appName, ...rest] = parts;
    const feature = storybookTitleSegment(appName);
    const technology = APP_TECHNOLOGIES.get(appName) ?? 'ts';

    return [feature, technology, ...subjectParts(appSubjectParts(appName, rest))].join('/');
  }

  if (root === 'tools') {
    const [, toolArea, ...rest] = parts;

    return [storybookTitleSegment(toolArea), 'ts', ...subjectParts(rest)].join('/');
  }

  return ['workspace', 'ts', ...subjectParts(parts)].join('/');
}
