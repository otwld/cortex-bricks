import { provideHttpClient } from '@angular/common/http';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import {
  createFakerGenetics,
  createJsonGetHandler,
  createMswSearchGetHandler,
  withStorybookProviders,
  withStoryMswHandlers,
} from '../storybook/storybook';
import { HttpClientSearchExampleComponent, type CandidateSearchRow } from './http-client-search-example.component';

interface Company {
  id: string;
  name: string;
}

const genetics = createFakerGenetics({
  seed: 'chromatic-storybook-http-client-search-v1',
  refDate: '2026-01-01T00:00:00.000Z',
});

const buildCompany = genetics.defineEntityFactory<void, Company>('company', ({ faker, id, key }) => ({
  id: id('company', key),
  name: faker.company.name(),
}));

const buildCandidate = genetics.defineEntityFactory<{ companyKey: number }, CandidateSearchRow>(
  'candidate',
  ({ faker, id, key, oneOf }, input) => {
    const company = buildCompany(input.companyKey, undefined);

    return {
      id: id('candidate', key),
      fullName: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      companyId: company.id,
      companyName: company.name,
      status: oneOf(['active', 'inactive', 'on-hold'] as const),
      skills: genetics.many(3, (index) =>
        oneOf(['angular', 'typescript', 'storybook', 'msw', 'rxjs', 'testing-library', `skill-${index + 1}`]),
      ),
    };
  },
);

const candidates = genetics.many(64, (index) => buildCandidate(index, { companyKey: index % 12 }));

const candidateSearchHandler = createMswSearchGetHandler(genetics, '/api/recruitment/candidates/search', candidates, {
  search: {
    searchBy: ['fullName', 'email', 'companyName', (item) => item.skills.join(' ')],
    sorters: {
      fullName: (item) => item.fullName,
      companyName: (item) => item.companyName,
    },
  },
});

const meta: Meta<HttpClientSearchExampleComponent> = {
  argTypes: {
    apiUrl: {
      control: 'text',
      description: 'Search API endpoint used by the example component.',
      table: { category: 'Inputs' },
    },
    initialQuery: {
      control: 'text',
      description: 'Query executed when the component initializes.',
      table: { category: 'Inputs' },
    },
  },
  component: HttpClientSearchExampleComponent,
  title: 'storybook/ng/http-client-search-example',
  decorators: [withStorybookProviders([provideHttpClient()])],
  args: {
    apiUrl: '/api/recruitment/candidates/search',
    initialQuery: 'angular',
  },
};

export default meta;

type Story = StoryObj<HttpClientSearchExampleComponent>;

/**
 * Search story with deterministic candidate data and a successful MSW response.
 */
export const HttpClientSeededSearchSuccess: Story = {
  parameters: {
    ...withStoryMswHandlers({
      candidateSearch: [candidateSearchHandler],
    }),
  },
  play: async ({ canvas, step, userEvent }) => {
    await step('render deterministic candidate search results', async () => {
      await expect(canvas.getByRole('heading', { name: /msw \+ faker search demo/i })).toBeVisible();
      await expect(await canvas.findByText(/candidates found/i)).toBeVisible();
      await expect(canvas.getByText('angular')).toBeVisible();
    });

    await step('show an empty result set from the same mocked API', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /no result/i }));
      await expect(await canvas.findByText(/no candidates for this search/i)).toBeVisible();
    });
  },
};

/**
 * Search story for the empty-results state.
 */
export const HttpClientSeededSearchNoResults: Story = {
  args: {
    initialQuery: 'nosuchcandidate',
  },
  parameters: {
    ...withStoryMswHandlers({
      candidateSearch: [candidateSearchHandler],
    }),
  },
  play: async ({ canvas, step }) => {
    await step('render the empty candidate search state', async () => {
      await expect(await canvas.findByText(/no candidates for this search/i)).toBeVisible();
      await expect(canvas.getByText('nosuchcandidate')).toBeVisible();
    });
  },
};

/**
 * Search story for a server-side failure response.
 */
export const HttpClientSearchServerError: Story = {
  parameters: {
    ...withStoryMswHandlers({
      candidateSearch: [
        createJsonGetHandler(
          '/api/recruitment/candidates/search',
          { message: 'Mocked upstream failure' },
          { status: 500 },
        ),
      ],
    }),
  },
  play: async ({ canvas, step }) => {
    await step('render the mocked server error state', async () => {
      await expect(await canvas.findByText(/unable to load candidates/i)).toBeVisible();
    });
  },
};
