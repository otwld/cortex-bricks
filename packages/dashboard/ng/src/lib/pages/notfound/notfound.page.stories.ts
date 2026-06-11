import { provideStorybookAngularApp } from '@otwld/ng-storybook';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { NotFoundPage } from './notfound.page';

const meta: Meta<NotFoundPage> = {
  argTypes: {},
  component: NotFoundPage,
  decorators: [
    applicationConfig({
      providers: [provideStorybookAngularApp({ includeHttpClient: false })],
    }),
  ],
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-not-found-page></app-not-found-page>`,
  }),
  title: 'dashboard/ng/pages/notfound',
};

export default meta;

type Story = StoryObj<NotFoundPage>;

/** Default Not Found Page state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render the not-found recovery action', async () => {
      await expect(canvas.getByText('Oops!')).toBeVisible();
      await expect(canvas.getByText('There is nothing here')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /go to dashboard/i })).toBeVisible();
    });
  },
};
