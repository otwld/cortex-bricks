import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { LoadMoreDirective, type LoadMoreQuery } from './load-more.directive';

const fetchNextPage = fn(async () => undefined);
const fetchPreviousPage = fn(async () => undefined);
const isFetching = fn(() => false);

const meta: Meta<LoadMoreDirective> = {
  argTypes: {
    direction: {
      control: 'inline-radio',
      description: 'Pagination direction to fetch when triggered.',
      options: ['next', 'previous'],
      table: { category: 'Inputs' },
    },
    query: {
      control: false,
      description: 'Minimal infinite query contract used by the directive.',
      table: { category: 'Inputs' },
    },
  },
  component: LoadMoreDirective,
  decorators: [
    moduleMetadata({
      imports: [LoadMoreDirective],
    }),
  ],
  title: 'tanstack/ng/load-more',
};

export default meta;

type Story = StoryObj<LoadMoreDirective>;

const candidateQuery: LoadMoreQuery = {
  fetchNextPage,
  fetchPreviousPage,
  isFetching,
};

/** Button host wired to a candidate list pagination query. */
export const Default: Story = {
  args: {
    direction: 'next',
    query: candidateQuery,
  },
  render: (args) => ({
    props: args,
    template: `<button type="button" tanstackLoadMore [query]="query" [direction]="direction">
      Load more candidates
    </button>`,
  }),
  play: async ({ canvas, step, userEvent }) => {
    await step('fetch the next candidate page on click and Enter', async () => {
      const button = canvas.getByRole('button', { name: /load more candidates/i });
      fetchNextPage.mockClear();

      await userEvent.click(button);
      button.focus();
      await userEvent.keyboard('{Enter}');

      await expect(fetchNextPage).toHaveBeenCalledTimes(2);
      await expect(fetchNextPage).toHaveBeenCalledWith({ cancelRefetch: false });
      await expect(fetchPreviousPage).not.toHaveBeenCalled();
    });
  },
};
