import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, within } from 'storybook/test';
import { TaskDrawer } from './task-drawer';

const cancelled = fn();
const save = fn();
const visibleChange = fn();

const meta: Meta<TaskDrawer> = {
  argTypes: {
    cancelled: {
      action: 'cancelled',
      description: 'Emitted when the drawer is cancelled or hidden.',
      table: { category: 'Outputs' },
    },
    mode: {
      control: 'radio',
      description: 'Whether the drawer creates or edits a task.',
      options: ['create', 'edit'],
      table: { category: 'Inputs' },
    },
    save: {
      action: 'save',
      description: 'Emitted with normalized task data when the form is saved.',
      table: { category: 'Outputs' },
    },
    task: {
      control: 'object',
      description: 'Task loaded into the drawer when editing.',
      table: { category: 'Inputs' },
    },
    visible: {
      control: 'boolean',
      description: 'Whether the drawer is visible.',
      table: { category: 'Inputs' },
    },
    visibleChange: {
      action: 'visibleChange',
      description: 'Emitted when the drawer changes visibility.',
      table: { category: 'Outputs' },
    },
  },
  args: {
    cancelled,
    mode: 'create',
    save,
    task: null,
    visible: true,
    visibleChange,
  },
  component: TaskDrawer,
  render: (args) => ({
    props: args,
    template: `
      <app-task-drawer
        [visible]="visible"
        [task]="task"
        [mode]="mode"
        (visibleChange)="visibleChange($event)"
        (save)="save($event)"
        (cancelled)="cancelled()"
      />
    `,
  }),
  title: 'dashboard/ng/apps/tasklist/task-drawer',
};

export default meta;

type Story = StoryObj<TaskDrawer>;

/** Default Task Drawer state. */
export const Default: Story = {
  play: async ({ canvasElement, step, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step('render create task form controls', async () => {
      await expect(await body.findByText('Create New Task')).toBeVisible();
      await expect(body.getByLabelText('Task Title')).toBeVisible();
      await expect(body.getByRole('button', { name: /create task/i })).toBeVisible();
    });

    await step('emit save and close actions', async () => {
      save.mockClear();
      cancelled.mockClear();
      visibleChange.mockClear();

      await userEvent.type(body.getByLabelText('Task Title'), 'Review candidate analytics');
      await userEvent.type(body.getByLabelText('Description'), 'Confirm the analytics cards before handoff.');
      await userEvent.click(body.getByRole('button', { name: /create task/i }));

      await expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: false,
          description: 'Confirm the analytics cards before handoff.',
          id: null,
          status: 'pending',
          title: 'Review candidate analytics',
        }),
      );
      await expect(cancelled).toHaveBeenCalledTimes(1);
      await expect(visibleChange).toHaveBeenCalledWith(false);
    });
  },
};
