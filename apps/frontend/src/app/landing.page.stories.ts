import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { LandingPage } from './landing.page';

const meta: Meta<LandingPage> = {
  argTypes: {},
  component: LandingPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-landing-page></app-landing-page>`,
  }),
  title: 'frontend/ng/landing',
};

export default meta;

type Story = StoryObj<LandingPage>;

/** Default Landing Page state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('show the frontend landing actions', async () => {
      await expect(canvas.getByRole('heading', { name: /lightweight angular shell/i })).toBeVisible();
      await expect(canvas.getByRole('link', { name: /sign in/i })).toBeVisible();
      await expect(canvas.getByRole('link', { name: /open dashboard/i })).toBeVisible();
    });
  },
};
