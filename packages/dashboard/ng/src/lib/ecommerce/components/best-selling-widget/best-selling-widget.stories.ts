import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, within } from 'storybook/test';
import { type BestSellingAction, type BestSellingProduct, BestSellingWidget } from './best-selling-widget';

const actionSelected = fn();

const products: readonly BestSellingProduct[] = [
  { id: 'job-offer-boost', name: 'JobOffer Boost', category: 'Recruiter Tools', salesShare: 72, tone: 'orange' },
  { id: 'candidate-screening-pack', name: 'Candidate Screening Pack', category: 'Candidate Services', salesShare: 54, tone: 'cyan' },
  { id: 'interview-kit', name: 'Interview Kit', category: 'Interview', salesShare: 38, tone: 'green' },
];

const actions: readonly BestSellingAction[] = [
  { id: 'add', label: 'Add New', icon: 'pi pi-fw pi-plus' },
  { id: 'remove', label: 'Remove', icon: 'pi pi-fw pi-trash' },
];

const meta: Meta<BestSellingWidget> = {
  argTypes: {
    actionSelected: {
      action: 'actionSelected',
      description: 'Emitted when the header menu action is selected.',
      table: { category: 'Outputs' },
    },
    actions: {
      control: 'object',
      description: 'Popup menu actions shown in the widget header.',
      table: { category: 'Inputs' },
    },
    products: {
      control: 'object',
      description: 'Products to render, with sales-share values clamped for display.',
      table: { category: 'Inputs' },
    },
    title: {
      control: 'text',
      description: 'Heading shown above the ranked product list.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    actionSelected,
    actions,
    products,
    title: 'Best Selling Products',
  },
  component: BestSellingWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-best-selling-widget
        [title]="title"
        [products]="products"
        [actions]="actions"
        (actionSelected)="actionSelected($event)"
      />
    `,
  }),
  title: 'dashboard/ng/ecommerce/best-selling-widget',
};

export default meta;

type Story = StoryObj<BestSellingWidget>;

/** Default Best Selling Widget state. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step('render ranked product rows', async () => {
      await expect(canvas.getByText('Best Selling Products')).toBeVisible();
      await expect(canvas.getByText('JobOffer Boost')).toBeVisible();
      await expect(canvas.getByText('72%')).toBeVisible();
      await expect(canvas.getByText('Candidate Screening Pack')).toBeVisible();
    });

    await step('emit a header menu action', async () => {
      actionSelected.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /best selling products actions/i }));
      await userEvent.click(await body.findByText('Add New'));

      await expect(actionSelected).toHaveBeenCalledWith({
        action: expect.objectContaining({ id: 'add', label: 'Add New' }),
      });
    });
  },
};
