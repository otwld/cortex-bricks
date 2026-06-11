import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { StorybookConfig } from '@analogjs/storybook-angular';
import { createStorybookNodeSourceLoaderPlugin } from '../../../packages/storybook/ts/src/vite/index.ts';
import remarkGfm from 'remark-gfm';
import { mergeConfig, type UserConfig } from 'vite';

const storybookTsConfig = fileURLToPath(new URL('../tsconfig.storybook.json', import.meta.url));
const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url));
const ignoredStorySearchDirectories = new Set([
  '.git',
  '.nx',
  'coverage',
  'dist',
  'node_modules',
  'tmp',
]);

function hasStoryFiles(directory: string): boolean {
  const absoluteDirectory = join(workspaceRoot, directory);

  for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoredStorySearchDirectories.has(entry.name)) {
        continue;
      }

      if (hasStoryFiles(join(directory, entry.name))) {
        return true;
      }

      continue;
    }

    if (/\.stories\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      return true;
    }
  }

  return false;
}

function optionalStoryGlob(directory: string): string[] {
  return hasStoryFiles(directory)
    ? [`../../../${directory}/**/*.stories.@(js|jsx|ts|tsx)`]
    : [];
}

const config: StorybookConfig = {
  stories: [
    '../../../apps/**/*.mdx',
    ...optionalStoryGlob('apps'),
    '../../../packages/**/*.mdx',
    ...optionalStoryGlob('packages'),
    '../../../tools/**/*.mdx',
    ...optionalStoryGlob('tools'),
  ],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    'storybook-addon-tag-badges',
  ],
  framework: {
    name: '@analogjs/storybook-angular',
    options: {
      tsconfig: storybookTsConfig,
    },
  },
  staticDirs: ['../public'],
  async viteFinal(config: UserConfig) {
    return mergeConfig(config, {
      plugins: [
        createStorybookNodeSourceLoaderPlugin({
          pluginName: 'documentation-source-loader',
        }),
        nxViteTsPaths(),
      ],
    });
  },
};

export default config;
