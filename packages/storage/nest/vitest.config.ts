import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vitest/config';
import { nestDecoratorMetadataPlugin } from '../../../tools/vitest/nest-decorator-metadata.plugin';

export default defineConfig({
  plugins: [nxViteTsPaths(), nestDecoratorMetadataPlugin()],
  test: {
    name: 'nest-storage',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    testTimeout: 180_000,
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../../coverage/packages/storage/nest',
    },
  },
});
