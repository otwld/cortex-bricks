import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { UserCreatePage } from './user-create.page';

const meta: Meta<UserCreatePage> = {
  argTypes: {},
  component: UserCreatePage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-user-create-page></app-user-create-page>`,
  }),
  title: 'dashboard/ng/user-management/user-create',
};

export default meta;

type Story = StoryObj<UserCreatePage>;

/** Default User Create Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render the single-page create form', async () => {
      await expect(canvas.getByText('Profile')).toBeVisible();
      await expect(canvas.getByLabelText('Nickname')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /create user/i })).toBeVisible();
    });

    await step('enter candidate profile details', async () => {
      await userEvent.type(canvas.getByLabelText('Nickname'), 'Aisha');
      await userEvent.type(canvas.getByLabelText('Bio'), 'Candidate shortlisted for the Angular platform team.');
      await userEvent.type(canvas.getByLabelText('Email'), 'aisha.patel@example.com');
      await userEvent.type(canvas.getByLabelText('City'), 'New York');
      await userEvent.type(canvas.getByLabelText('Website'), 'aisha-patel.dev');

      await expect(canvas.getByLabelText('Nickname')).toHaveValue('Aisha');
      await expect(canvas.getByLabelText('Email')).toHaveValue('aisha.patel@example.com');
      await expect(canvas.getByLabelText('Website')).toHaveValue('aisha-patel.dev');
    });
  },
};
