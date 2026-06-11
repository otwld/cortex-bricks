import { provideStorybookRouter } from '@otwld/ng-storybook';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { FormStateService } from '../../form-state.service';
import { Authorization } from './authorization';

const navigate = fn();

const meta: Meta<Authorization> = {
  argTypes: {},
  component: Authorization,
  decorators: [
    applicationConfig({
      providers: [
        FormStateService,
        provideStorybookRouter({ navigate }),
      ],
    }),
  ],
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-authorization></app-authorization>`,
  }),
  title: 'dashboard/ng/pages/user-management/steps/authorization',
};

export default meta;

type Story = StoryObj<Authorization>;

/** Default Authorization state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    navigate.mockClear();

    await step('render role and permission controls', async () => {
      await expect(canvas.getByText('Authorization and Access')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /member/i })).toBeVisible();
      await expect(canvas.getByLabelText('read:Finance')).toBeInTheDocument();
    });

    await step('select elevated access and continue', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /admin/i }));
      await userEvent.click(canvas.getByLabelText('read:Finance'));
      await userEvent.click(canvas.getByRole('button', { name: /continue/i }));

      await expect(canvas.getByLabelText('read:Finance')).toBeChecked();
      await expect(navigate).toHaveBeenCalledWith(['/dashboard/profile/create/account-status']);
    });
  },
};
