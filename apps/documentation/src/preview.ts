import { provideRouter } from '@angular/router';
import type { Preview } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { createStorybookMswPreview, defineStorybookMswHandlers } from '@otwld/ng-storybook';

import './styles.css';

const mswPreview = createStorybookMswPreview(
  defineStorybookMswHandlers({
    health: [],
  })
);

const preview: Preview = {
  controls: {
    sort: 'requiredFirst', // for stories
  },
  docs: {
    controls: {
      sort: 'requiredFirst', // for docs
    },
  },
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
  loaders: [...(Array.isArray(mswPreview.loaders) ? mswPreview.loaders : [])],
  parameters: {
    docs: {
      codePanel: true,
    },
    ...(mswPreview.parameters ?? {}),
  },
};

export default preview;
