import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { type RecentSale, type RecentSaleColumn, RecentSalesWidget } from './recent-sales-widget';

const saleSelected = fn();
const salesExported = fn();

const sales: readonly RecentSale[] = [
  { id: '1000', code: 'job-boost', name: 'JobOffer Boost', category: 'Recruiter Tools', price: 149, status: 'INSTOCK' },
  { id: '1001', code: 'candidate-check', name: 'Candidate Check', category: 'Candidate Services', price: 79, status: 'LOWSTOCK' },
  { id: '1002', code: 'interview-room', name: 'Interview Room', category: 'Interview', price: 59, status: 'OUTOFSTOCK' },
];

const columns: readonly RecentSaleColumn[] = [
  { field: 'name', header: 'Name', sortable: true, minWidthClass: 'min-w-36' },
  { field: 'category', header: 'Category', sortable: true, minWidthClass: 'min-w-36' },
  { field: 'price', header: 'Price', type: 'currency', sortable: true, minWidthClass: 'min-w-28' },
  { field: 'status', header: 'Status', type: 'status', sortable: true, exportHeader: 'Inventory Status', minWidthClass: 'min-w-32' },
];

const meta: Meta<RecentSalesWidget> = {
  argTypes: {
    columns: {
      control: 'object',
      description: 'Dynamic table columns rendered by the recent-sales table.',
      table: { category: 'Inputs' },
    },
    currencyCode: {
      control: 'text',
      description: 'Currency code used by currency columns.',
      table: { category: 'Inputs' },
    },
    emptyMessage: {
      control: 'text',
      description: 'Message shown when no sales are available.',
      table: { category: 'Inputs' },
    },
    exportAriaLabel: {
      control: 'text',
      description: 'Accessible label for the export button.',
      table: { category: 'Inputs' },
    },
    exportTooltip: {
      control: 'text',
      description: 'Tooltip text for the export button.',
      table: { category: 'Inputs' },
    },
    globalFilterFields: {
      control: 'object',
      description: 'Fields used by PrimeNG global table filtering.',
      table: { category: 'Inputs' },
    },
    paginator: {
      control: 'boolean',
      description: 'Enables PrimeNG table pagination.',
      table: { category: 'Inputs' },
    },
    rows: {
      control: { min: 1, type: 'number' },
      description: 'Rows shown per page when pagination is enabled.',
      table: { category: 'Inputs' },
    },
    saleSelected: {
      action: 'saleSelected',
      description: 'Emitted when a sale row is selected.',
      table: { category: 'Outputs' },
    },
    sales: {
      control: 'object',
      description: 'Sale rows displayed by the table.',
      table: { category: 'Inputs' },
    },
    salesExported: {
      action: 'salesExported',
      description: 'Emitted after the export button is selected.',
      table: { category: 'Outputs' },
    },
    searchAriaLabel: {
      control: 'text',
      description: 'Accessible label for the global search input.',
      table: { category: 'Inputs' },
    },
    searchPlaceholder: {
      control: 'text',
      description: 'Placeholder text for the global search input.',
      table: { category: 'Inputs' },
    },
    showExport: {
      control: 'boolean',
      description: 'Controls whether the export button is rendered.',
      table: { category: 'Inputs' },
    },
    showSearch: {
      control: 'boolean',
      description: 'Controls whether the search box is rendered.',
      table: { category: 'Inputs' },
    },
    showViewAction: {
      control: 'boolean',
      description: 'Controls whether row view buttons are rendered.',
      table: { category: 'Inputs' },
    },
    tableMinWidth: {
      control: 'text',
      description: 'CSS width passed to PrimeNG tableStyle.',
      table: { category: 'Inputs' },
    },
    title: {
      control: 'text',
      description: 'Heading shown above the sales table.',
      table: { category: 'Inputs' },
    },
    viewHeader: {
      control: 'text',
      description: 'Header text for the optional row action column.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    columns,
    currencyCode: 'USD',
    emptyMessage: 'No recent sales to display.',
    exportAriaLabel: 'Export recent sales',
    exportTooltip: 'Export',
    globalFilterFields: ['name', 'category', 'price', 'status'],
    paginator: false,
    rows: 5,
    saleSelected,
    sales,
    salesExported,
    searchAriaLabel: 'Search recent sales',
    searchPlaceholder: 'Search',
    showExport: true,
    showSearch: true,
    showViewAction: true,
    tableMinWidth: '44rem',
  title: 'dashboard/ng/ecommerce/recent-sales-widget',
    viewHeader: 'View',
  },
  component: RecentSalesWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-recent-sales-widget
        [title]="title"
        [sales]="sales"
        [columns]="columns"
        [rows]="rows"
        [paginator]="paginator"
        [tableMinWidth]="tableMinWidth"
        [globalFilterFields]="globalFilterFields"
        [currencyCode]="currencyCode"
        [showSearch]="showSearch"
        [showExport]="showExport"
        [showViewAction]="showViewAction"
        [searchPlaceholder]="searchPlaceholder"
        [searchAriaLabel]="searchAriaLabel"
        [exportTooltip]="exportTooltip"
        [exportAriaLabel]="exportAriaLabel"
        [viewHeader]="viewHeader"
        [emptyMessage]="emptyMessage"
        (saleSelected)="saleSelected($event)"
        (salesExported)="salesExported($event)"
      />
    `,
  }),
  title: 'dashboard/ng/ecommerce/recent-sales-widget',
};

export default meta;

type Story = StoryObj<RecentSalesWidget>;

/** Default Recent Sales Widget state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render sales table and toolbar controls', async () => {
      await expect(canvas.getByText('Recent Sales')).toBeVisible();
      await expect(canvas.getByText('JobOffer Boost')).toBeVisible();
      await expect(canvas.getByText('Candidate Check')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /export recent sales/i })).toBeVisible();
    });

    await step('emit export and row selection actions', async () => {
      saleSelected.mockClear();
      salesExported.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /export recent sales/i }));
      await expect(salesExported).toHaveBeenCalledWith({
        columns,
        rows: sales,
      });

      await userEvent.type(canvas.getByLabelText(/search recent sales/i), 'Interview');
      await new Promise((resolve) => window.setTimeout(resolve, 150));

      await expect(canvas.getByText('Interview Room')).toBeVisible();
      await userEvent.click(canvas.getByRole('button', { name: /view interview room/i }));

      await expect(saleSelected).toHaveBeenCalledWith({
        sale: expect.objectContaining({ id: '1002', name: 'Interview Room' }),
      });
    });
  },
};
