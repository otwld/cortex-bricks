import type { Plugin } from 'vite';

export interface StorybookSourceLoaderPluginOptions {
  importPrefix?: string;
  pluginName?: string;
  resolveSourcePath: (requestedPath: string, importer?: string) => string;
  readSourceFile: (absoluteSourcePath: string) => string;
}

/**
 * Creates a Vite plugin that resolves imports like `source-loader:./file.ts`
 * into virtual modules exporting the file contents as a string.
 */
export function createStorybookSourceLoaderPlugin(options: StorybookSourceLoaderPluginOptions): Plugin {
  const importPrefix = options.importPrefix ?? 'source-loader:';
  const pluginName = options.pluginName ?? 'storybook-source-loader';
  const { resolveSourcePath, readSourceFile } = options;
  let virtualModuleIndex = 0;
  const virtualModuleCodeById = new Map<string, string>();

  return {
    name: pluginName,
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.startsWith(importPrefix)) {
        return null;
      }

      const requestedPath = source.slice(importPrefix.length);
      const absolutePath = resolveSourcePath(requestedPath, importer);
      const sourceCode = readSourceFile(absolutePath);
      const virtualId = `\0${pluginName}:${virtualModuleIndex++}`;
      virtualModuleCodeById.set(virtualId, sourceCode);

      return virtualId;
    },
    load(id) {
      if (!virtualModuleCodeById.has(id)) {
        return null;
      }

      const sourceCode = virtualModuleCodeById.get(id) ?? '';

      return `export default ${JSON.stringify(sourceCode)};`;
    },
  };
}
