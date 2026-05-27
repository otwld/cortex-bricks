import * as ts from 'typescript';
import type { Plugin } from 'vitest/config';

const shouldTransform = (id: string): boolean => {
  if (!id.endsWith('.ts') || id.endsWith('.d.ts')) return false;
  if (id.includes('/node_modules/')) return false;
  return true;
};

export function nestDecoratorMetadataPlugin(): Plugin {
  return {
    name: 'nest-decorator-metadata',
    enforce: 'pre',
    transform(code, id) {
      if (!shouldTransform(id)) return undefined;

      const result = ts.transpileModule(code, {
        fileName: id,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2021,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          importHelpers: true,
          sourceMap: true,
          inlineSources: true,
          useDefineForClassFields: false,
        },
      });

      return {
        code: result.outputText,
        map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null,
      };
    },
  };
}
