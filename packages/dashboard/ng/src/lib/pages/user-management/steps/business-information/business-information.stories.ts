import { provideStorybookRouter } from '@otwld/ng-storybook';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { FormStateService } from '../../form-state.service';
import { BusinessInformation } from './business-information';

const navigate = fn();

const meta: Meta<BusinessInformation> = {
  argTypes: {},
  component: BusinessInformation,
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
    template: `<app-business-information></app-business-information>`,
  }),
  title: 'dashboard/ng/user-management/steps/business-information',
};

export default meta;

type Story = StoryObj<BusinessInformation>;

/** Default Business Information state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    navigate.mockClear();

    await step('render business fields', async () => {
      await expect(canvas.getByText('Business Information')).toBeVisible();
      await expect(canvas.getByLabelText('Office Location')).toBeVisible();
      await expect(canvas.getByText('Hybrid work enabled')).toBeVisible();
    });

    await step('enter office details and continue', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /manager/i }));
      await userEvent.type(canvas.getByLabelText('Office Location'), 'Remote - New York');
      await userEvent.click(canvas.getByRole('button', { name: /continue/i }));

      await expect(canvas.getByLabelText('Office Location')).toHaveValue('Remote - New York');
      await expect(navigate).toHaveBeenCalledWith(['/dashboard/profile/create/location-information']);
    });
  },
};
