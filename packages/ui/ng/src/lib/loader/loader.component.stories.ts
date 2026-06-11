import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { LoaderComponent } from './loader.component';

const meta: Meta<LoaderComponent> = {
  argTypes: {
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the loading indicator.',
      table: { category: 'Inputs' },
    },
    backdropOpacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Opacity used by overlay and fullscreen backdrops.',
      table: { category: 'Inputs' },
    },
    mode: {
      control: 'select',
      description: 'Layout mode for the loader.',
      options: ['inline', 'block', 'overlay', 'fullscreen', 'button'],
      table: { category: 'Inputs' },
    },
    showBackdrop: {
      control: 'boolean',
      description: 'Whether overlay and fullscreen loaders render a backdrop.',
      table: { category: 'Inputs' },
    },
    size: {
      control: 'inline-radio',
      description: 'Spinner size.',
      options: ['sm', 'md', 'lg'],
      table: { category: 'Inputs' },
    },
    text: {
      control: 'text',
      description: 'Optional visible loading text.',
      table: { category: 'Inputs' },
    },
    textPosition: {
      control: 'inline-radio',
      description: 'Position of visible loader text.',
      options: ['right', 'bottom'],
      table: { category: 'Inputs' },
    },
    transparent: {
      control: 'boolean',
      description: 'Whether the backdrop is transparent.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    ariaLabel: null,
    backdropOpacity: 0.4,
    mode: 'block',
    showBackdrop: true,
    size: 'md',
    text: 'Loading candidate records',
    textPosition: 'right',
    transparent: false,
  },
  component: LoaderComponent,
  parameters: {
    actions: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `
      <kit-loader
        [mode]="mode"
        [text]="text"
        [size]="size"
        [textPosition]="textPosition"
        [showBackdrop]="showBackdrop"
        [transparent]="transparent"
        [backdropOpacity]="backdropOpacity"
        [ariaLabel]="ariaLabel"
      />
    `,
  }),
  title: 'ui/ng/loader',
};

export default meta;

type Story = StoryObj<LoaderComponent>;

/** Default Loader Component state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render an accessible loading status', async () => {
      const status = canvas.getByRole('status', { name: /loading candidate records/i });

      await expect(status).toBeVisible();
      await expect(status).toHaveAttribute('aria-busy', 'true');
      await expect(canvas.getByText('Loading candidate records')).toBeVisible();
    });
  },
};
