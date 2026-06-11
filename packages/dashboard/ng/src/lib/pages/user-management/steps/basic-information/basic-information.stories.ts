import { SignedUrlCacheService, StorageService } from '@otwld/ng-storage';
import { provideStorybookRouter } from '@otwld/ng-storybook';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn } from 'storybook/test';
import { FormStateService } from '../../form-state.service';
import { BasicInformation } from './basic-information';

const navigate = fn();

const meta: Meta<BasicInformation> = {
  argTypes: {},
  component: BasicInformation,
  decorators: [
    applicationConfig({
      providers: [
        FormStateService,
        provideStorybookRouter({ navigate }),
        {
          provide: StorageService,
          useValue: { upload: fn() },
        },
        {
          provide: SignedUrlCacheService,
          useValue: { get: () => of('') },
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
    template: `<app-basic-information></app-basic-information>`,
  }),
  title: 'dashboard/ng/user-management/steps/basic-information',
};

export default meta;

type Story = StoryObj<BasicInformation>;

/** Default Basic Information state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    navigate.mockClear();

    await step('render basic profile fields', async () => {
      await expect(canvas.getByText('Basic Information')).toBeVisible();
      await expect(canvas.getByLabelText('Avatar')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /upload avatar/i })).toBeVisible();
    });

    await step('enter candidate identity and continue', async () => {
      await userEvent.type(canvas.getByLabelText('First Name'), 'Aisha');
      await userEvent.type(canvas.getByLabelText('Last Name'), 'Patel');
      await userEvent.type(canvas.getByLabelText('Email'), 'aisha.patel@example.com');
      await userEvent.type(canvas.getByLabelText('Bio'), 'Senior Angular engineer focused on dashboard workflows.');
      await userEvent.click(canvas.getByRole('button', { name: /continue/i }));

      await expect(canvas.getByLabelText('First Name')).toHaveValue('Aisha');
      await expect(canvas.getByLabelText('Email')).toHaveValue('aisha.patel@example.com');
      await expect(navigate).toHaveBeenCalledWith(['/dashboard/profile/create/business-information']);
    });
  },
};
