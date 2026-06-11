import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { type TopProduct, TopProductsWidget } from './top-products-widget';

const productSelected = fn();

const products: readonly TopProduct[] = [
  { id: 'job-offer-boost', name: 'JobOffer Boost', image: 'bamboo-watch.jpg', price: 149, rating: 5 },
  { id: 'candidate-screening-pack', name: 'Candidate Screening Pack', image: 'black-watch.jpg', price: 79, rating: 4 },
  { id: 'interview-kit', name: 'Interview Kit', image: 'blue-band.jpg', price: 59, rating: 4 },
];

const meta: Meta<TopProductsWidget> = {
  argTypes: {
    currencyCode: {
      control: 'text',
      description: 'Currency code passed to Angular currency formatting.',
      table: { category: 'Inputs' },
    },
    currencyDigits: {
      control: 'text',
      description: 'Digit info passed to Angular currency formatting.',
      table: { category: 'Inputs' },
    },
    currencyDisplay: {
      control: 'select',
      description: 'Currency display style passed to Angular currency formatting.',
      options: ['symbol', 'code', 'symbol-narrow'],
      table: { category: 'Inputs' },
    },
    emptyMessage: {
      control: 'text',
      description: 'Message shown when no products are available.',
      table: { category: 'Inputs' },
    },
    imageBaseUrl: {
      control: 'text',
      description: 'Base URL prepended to relative product image names.',
      table: { category: 'Inputs' },
    },
    maxProducts: {
      control: { min: 0, type: 'number' },
      description: 'Maximum number of products displayed.',
      table: { category: 'Inputs' },
    },
    productSelected: {
      action: 'productSelected',
      description: 'Emitted when a product row is selected.',
      table: { category: 'Outputs' },
    },
    products: {
      control: 'object',
      description: 'Products rendered in rank order.',
      table: { category: 'Inputs' },
    },
    title: {
      control: 'text',
      description: 'Heading shown above the product list.',
      table: { category: 'Inputs' },
    },
  },
  args: {
    currencyCode: 'USD',
    currencyDigits: '1.0-0',
    currencyDisplay: 'symbol',
    emptyMessage: 'No top products to display.',
    imageBaseUrl: 'https://primefaces.org/cdn/primeng/images/demo/product/',
    maxProducts: 6,
    productSelected,
    products,
    title: 'dashboard/ng/ecommerce/components/top-products-widget',
  },
  component: TopProductsWidget,
  render: (args) => ({
    props: args,
    template: `
      <app-top-products-widget
        [title]="title"
        [products]="products"
        [maxProducts]="maxProducts"
        [imageBaseUrl]="imageBaseUrl"
        [currencyCode]="currencyCode"
        [currencyDisplay]="currencyDisplay"
        [currencyDigits]="currencyDigits"
        [emptyMessage]="emptyMessage"
        (productSelected)="productSelected($event)"
      />
    `,
  }),
  title: 'dashboard/ng/ecommerce/components/top-products-widget',
};

export default meta;

type Story = StoryObj<TopProductsWidget>;

/** Default Top Products Widget state. */
export const Default: Story = {
  play: async ({ canvas, step, userEvent }) => {
    await step('render ranked products with prices', async () => {
      await expect(canvas.getByText('Top Products')).toBeVisible();
      await expect(canvas.getByText('JobOffer Boost')).toBeVisible();
      await expect(canvas.getByText('$149')).toBeVisible();
      await expect(canvas.getByRole('img', { name: /candidate screening pack/i })).toBeVisible();
    });

    await step('emit the selected product action', async () => {
      productSelected.mockClear();

      await userEvent.click(canvas.getByRole('button', { name: /view candidate screening pack/i }));

      await expect(productSelected).toHaveBeenCalledWith({
        product: expect.objectContaining({ id: 'candidate-screening-pack', name: 'Candidate Screening Pack' }),
      });
    });
  },
};
