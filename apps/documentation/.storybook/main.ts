import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { StorybookConfig } from '@analogjs/storybook-angular';
import { createStorybookNodeSourceLoaderPlugin } from '../../../packages/storybook/ts/vite/src/index.ts';
import remarkGfm from 'remark-gfm';
import { mergeConfig, type UserConfig } from 'vite';

const config: StorybookConfig = {
  stories: [
    '../../../packages/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
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
      tsconfig: './tsconfig.storybook.json',
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
