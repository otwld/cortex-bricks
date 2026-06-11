import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { provideStorybookAngularApp } from '@otwld/ng-storybook';
import { UserCreateLayoutPage } from './user-create-layout.page';

const meta: Meta<UserCreateLayoutPage> = {
  argTypes: {},
  component: UserCreateLayoutPage,
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
    template: `<app-user-create-layout-page></app-user-create-layout-page>`,
  }),
  title: 'dashboard/ng/pages/user-management/user-create-layout',
};

export default meta;

type Story = StoryObj<UserCreateLayoutPage>;

/** Default User Create Layout Page state. */
export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step('render the create-user wizard navigation', async () => {
      await expect(canvas.getAllByText('Create User')[0]).toBeVisible();
      await expect(canvas.getByRole('button', { name: /basic information/i })).toBeVisible();
      await expect(canvas.getByRole('button', { name: /business information/i })).toBeVisible();
      await expect(canvas.getByRole('button', { name: /account status/i })).toBeVisible();
    });
  },
};
