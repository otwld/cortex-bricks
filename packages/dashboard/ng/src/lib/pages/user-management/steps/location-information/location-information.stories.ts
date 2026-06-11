import { Router } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { FormStateService } from '../../form-state.service';
import { LocationInformation } from './location-information';

const navigate = fn();

const meta: Meta<LocationInformation> = {
  argTypes: {},
  component: LocationInformation,
  decorators: [
    applicationConfig({
      providers: [
        FormStateService,
        {
          provide: Router,
          useValue: { navigate },
        },
      ],
    }),
  ],
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-location-information></app-location-information>`,
  }),
  title: 'dashboard/ng/user-management/steps/location-information',
};

export default meta;

type Story = StoryObj<LocationInformation>;

/** Default Location Information state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    navigate.mockClear();

    await step('render location fields', async () => {
      await expect(canvas.getByText('Location Information')).toBeVisible();
      await expect(canvas.getByLabelText('Region')).toBeVisible();
      await expect(canvas.getByLabelText('Address Line 1')).toBeVisible();
    });

    await step('enter candidate location and continue', async () => {
      await userEvent.type(canvas.getByLabelText('Region'), 'NY');
      await userEvent.type(canvas.getByLabelText('City'), 'New York');
      await userEvent.type(canvas.getByLabelText('Postal Code'), '10001');
      await userEvent.type(canvas.getByLabelText('Address Line 1'), '12 Hiring Loop');
      await userEvent.click(canvas.getByRole('button', { name: /continue/i }));

      await expect(canvas.getByLabelText('City')).toHaveValue('New York');
      await expect(navigate).toHaveBeenCalledWith(['/dashboard/profile/create/authorization']);
    });
  },
};
