import { fileURLToPath } from 'node:url';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { StorybookConfig } from '@analogjs/storybook-angular';
import { createStorybookNodeSourceLoaderPlugin } from '../../../packages/storybook/ts/src/vite/index.ts';
import remarkGfm from 'remark-gfm';
import { mergeConfig, type UserConfig } from 'vite';

const storybookTsConfig = fileURLToPath(new URL('../tsconfig.storybook.json', import.meta.url));

const config: StorybookConfig = {
  stories: ['../../../packages/**/*.mdx', '../../../packages/**/*.stories.@(js|jsx|ts|tsx)', '../*.mdx'],
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
