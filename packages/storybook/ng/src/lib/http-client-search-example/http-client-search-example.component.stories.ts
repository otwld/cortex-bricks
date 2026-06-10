import { provideHttpClient } from '@angular/common/http';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';

import {
  createFakerGenetics,
  createJsonGetHandler,
  createMswSearchGetHandler,
  withStoryMswHandlers,
} from '../storybook/storybook';
import { HttpClientSearchExampleComponent, type CandidateSearchItem } from './http-client-search-example.component';

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

const buildCandidate = genetics.defineEntityFactory<{ companyKey: number }, CandidateSearchItem>(
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
        oneOf([
          'angular',
          'typescript',
          'storybook',
          'msw',
          'rxjs',
          'testing-library',
          `skill-${index + 1}`,
        ])
      ),
    };
  }
);

const candidates = genetics.many(64, (index) =>
  buildCandidate(index, { companyKey: index % 12 })
);

const candidateSearchHandler = createMswSearchGetHandler(
  genetics,
  '/api/recruitment/candidates/search',
  candidates,
  {
    search: {
      searchBy: ['fullName', 'email', 'companyName', (item) => item.skills.join(' ')],
      sorters: {
        fullName: (item) => item.fullName,
        companyName: (item) => item.companyName,
      },
    },
  }
);

const meta: Meta<HttpClientSearchExampleComponent> = {
  component: HttpClientSearchExampleComponent,
  title: 'storybook/ng/http-client-search-example',
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
  ],
  args: {
    initialQuery: 'engineer',
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
          { status: 500 }
        ),
      ],
    }),
  },
};
