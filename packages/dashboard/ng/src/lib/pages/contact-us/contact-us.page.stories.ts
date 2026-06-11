import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { ContactUsPage } from './contact-us.page';

const meta: Meta<ContactUsPage> = {
  argTypes: {},
  component: ContactUsPage,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-contact-us-page></app-contact-us-page>`,
  }),
  title: 'dashboard/ng/contact-us',
};

export default meta;

type Story = StoryObj<ContactUsPage>;

/** Default Contact Us Page state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render contact details and message form', async () => {
      await expect(canvas.getByText('Contact Us')).toBeVisible();
      await expect(canvas.getByText('Send Us Email')).toBeVisible();
      await expect(canvas.getByText('Our Head Office')).toBeVisible();
    });

    await step('fill the message form', async () => {
      await userEvent.type(canvas.getByLabelText('Name'), 'Aisha Patel');
      await userEvent.type(canvas.getByLabelText('Email Address'), 'aisha.patel@example.com');
      await userEvent.type(canvas.getByLabelText('Message'), 'I would like to discuss a senior Angular role.');

      await expect(canvas.getByLabelText('Name')).toHaveValue('Aisha Patel');
      await expect(canvas.getByLabelText('Email Address')).toHaveValue('aisha.patel@example.com');
      await expect(canvas.getByLabelText('Message')).toHaveValue('I would like to discuss a senior Angular role.');
      await expect(canvas.getByRole('button', { name: /send message/i })).toBeVisible();
    });
  },
};
