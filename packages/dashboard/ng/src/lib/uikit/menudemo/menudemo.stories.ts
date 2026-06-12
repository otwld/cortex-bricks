import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { MenuDemo } from './menudemo';

const meta: Meta<MenuDemo> = {
  argTypes: {},
  component: MenuDemo,
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
  title: 'dashboard/ng/uikit/menudemo',
};

export default meta;

type Story = StoryObj<MenuDemo>;

/** Default Menu Demo state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    await step('render the menu examples', async () => {
      await expect(canvas.getByText('Menubar')).toBeVisible();
      await expect(canvas.getByText('Breadcrumb')).toBeVisible();
      await expect(canvas.getByText('Tiered Menu')).toBeVisible();
      await expect(canvas.getByText('PanelMenu')).toBeVisible();
    });

    await step('open the overlay menu', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /options/i }));

      await expect(await within(canvasElement.ownerDocument.body).findByRole('menuitem', { name: /update/i })).toBeInTheDocument();
    });
  },
};
