import { addons } from 'storybook/manager-api';

import theme from './theme';
import {
  defaultConfig,
  TagBadgeParameters,
} from 'storybook-addon-tag-badges/manager-helpers';

addons.setConfig({
  theme,
});

addons.setConfig({
  tagBadges: [
    {
      tags: 'wip',
      badge: {
        text: 'WIP 🚧',
        style: {
          backgroundColor: '#f1c40f',
          color: 'black',
        },
        tooltip: 'This feature is under development',
      },
    },
    ...defaultConfig,
  ] satisfies TagBadgeParameters,
});
