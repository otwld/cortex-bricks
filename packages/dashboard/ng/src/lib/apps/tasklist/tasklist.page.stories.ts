import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { TaskListPage } from './tasklist.page';

const meta: Meta<TaskListPage> = {
  argTypes: {},
  component: TaskListPage,
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    props: args,
    template: `<app-tasklist></app-tasklist>`,
  }),
  title: 'dashboard/ng/apps/tasklist',
};

export default meta;

type Story = StoryObj<TaskListPage>;

/** Default Task List Page state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step('render grouped task sections', async () => {
      await expect(canvas.getByText(/tasks pending/i)).toBeVisible();
      await expect(canvas.getByText(/tasks in progress/i)).toBeVisible();
      await expect(canvas.getByText(/tasks completed/i)).toBeVisible();
      await expect(canvas.getByText('Design a SaaS Platform UI')).toBeInTheDocument();
    });

    await step('filter tasks by search query', async () => {
      await userEvent.type(canvas.getByPlaceholderText('Search'), 'Finance');

      await expect(await canvas.findByText('Create a Finance Dashboard UI')).toBeInTheDocument();
      await expect(canvas.queryByText('Design a SaaS Platform UI')).not.toBeInTheDocument();
    });

    await step('create a new task from the drawer', async () => {
      await userEvent.clear(canvas.getByPlaceholderText('Search'));
      await userEvent.click(canvas.getByRole('button', { name: /add new task/i }));

      await userEvent.type(await body.findByLabelText('Task Title'), 'Review candidate analytics');
      await userEvent.type(body.getByLabelText('Description'), 'Confirm the analytics cards before handoff.');
      await userEvent.click(body.getByRole('button', { name: /create task/i }));

      await expect(canvas.getByText('Review candidate analytics')).toBeInTheDocument();
    });
  },
};
