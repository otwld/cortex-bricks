import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import type { Shortcut } from '@otwld/ts-sdk';
import { ShortcutsComponent } from './shortcuts.component';

const candidateReviewShortcuts: Shortcut[] = [
  { callback: () => undefined, key: 'J', labelI18n: 'Next candidate' },
  { callback: () => undefined, key: 'K', labelI18n: 'Previous candidate' },
  { callback: () => undefined, key: 'A', labelI18n: 'Approve shortlist' },
  { callback: () => undefined, key: 'R', labelI18n: 'Reject shortlist' },
  { callback: () => undefined, key: '/', labelI18n: 'Search candidates' },
];

const meta: Meta<ShortcutsComponent> = {
  argTypes: {
    shortcuts: {
      control: 'object',
      description: 'Keyboard shortcuts to split into responsive columns.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    shortcuts: candidateReviewShortcuts,
  },
  component: ShortcutsComponent,
  parameters: {
    actions: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<kit-shortcuts [shortcuts]="shortcuts" />`,
  }),
  title: 'ui/ng/shortcuts',
};

export default meta;

type Story = StoryObj<ShortcutsComponent>;

/** Default Shortcuts Component state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render candidate-review shortcut rows', async () => {
      await expect(canvas.getByText('Next candidate')).toBeVisible();
      await expect(canvas.getByText('J')).toBeVisible();
      await expect(canvas.getByText('Search candidates')).toBeVisible();
      await expect(canvas.getByText('/')).toBeVisible();
    });
  },
};
