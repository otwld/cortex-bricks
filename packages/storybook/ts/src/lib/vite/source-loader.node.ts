import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { createStorybookSourceLoaderPlugin } from './source-loader.plugin.ts';

export interface StorybookNodeSourceLoaderPluginOptions {
  importPrefix?: string;
  pluginName?: string;
}

/**
 * Convenience helper for Node-based Storybook configs.
 * Keeps callsites short while reusing the shared source-loader plugin.
 */
export function createStorybookNodeSourceLoaderPlugin(
  options: StorybookNodeSourceLoaderPluginOptions = {}
): Plugin {
  return createStorybookSourceLoaderPlugin({
    importPrefix: options.importPrefix,
    pluginName: options.pluginName,
    resolveSourcePath: (requestedPath, importer) =>
      importer
        ? resolve(dirname(importer), requestedPath)
        : resolve(process.cwd(), requestedPath),
    readSourceFile: (absoluteSourcePath) => readFileSync(absoluteSourcePath, 'utf8'),
  });
}
