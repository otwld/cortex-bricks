import { createFakerGenetics } from './faker-genetics';

interface Candidate {
  active: boolean;
  id: string;
  name: string;
  skills: string[];
}

describe('createFakerGenetics', () => {
  it('creates deterministic entities and caches each scoped key', () => {
    const createCandidateFactory = () => {
      const genetics = createFakerGenetics({
        seed: 'recruitment-candidates-v1',
      });
      const buildCandidate = genetics.defineEntityFactory<void, Candidate>(
        'candidate',
        ({ faker, id, key }) => ({
          active: true,
          id: id('candidate', key),
          name: faker.person.fullName(),
          skills: [],
        })
      );

      return buildCandidate;
    };

    const buildCandidate = createCandidateFactory();
    const first = buildCandidate(0, undefined);

    expect(buildCandidate(0, undefined)).toBe(first);
    expect(createCandidateFactory()(0, undefined)).toEqual(first);
    expect(buildCandidate(1, undefined)).not.toEqual(first);
  });

  it('filters, sorts, and paginates search results', () => {
    const genetics = createFakerGenetics({ seed: 'candidate-search-v1' });
    const candidates: Candidate[] = [
      {
        active: true,
        id: 'candidate_ada',
        name: 'Ada Lovelace',
        skills: ['angular'],
      },
      {
        active: true,
        id: 'candidate_grace',
        name: 'Grace Hopper',
        skills: ['engineer'],
      },
      {
        active: false,
        id: 'candidate_linus',
        name: 'Engineer Linus Torvalds',
        skills: ['linux'],
      },
      {
        active: true,
        id: 'candidate_bjarne',
        name: 'Engineer Bjarne Stroustrup',
        skills: ['c++'],
      },
    ];
    const options = {
      filters: [(candidate: Candidate) => candidate.active],
      searchBy: ['name' as const, (candidate: Candidate) => candidate.skills.join(' ')],
      sorters: {
        name: (candidate: Candidate) => candidate.name,
      },
    };

    expect(
      genetics.search(
        candidates,
        {
          page: 1,
          pageSize: 1,
          query: 'engineer',
          sortBy: 'name',
          sortDirection: 'desc',
        },
        options
      )
    ).toEqual({
      hasNextPage: true,
      items: [candidates[1]],
      page: 1,
      pageSize: 1,
      total: 2,
      totalPages: 2,
    });

    expect(
      genetics.search(
        candidates,
        {
          page: 99,
          pageSize: 1,
          query: 'engineer',
          sortBy: 'name',
          sortDirection: 'desc',
        },
        options
      ).items
    ).toEqual([candidates[3]]);
  });

  it('rejects empty random choices', () => {
    const genetics = createFakerGenetics({ seed: 'candidate-roles-v1' });
    const buildRole = genetics.defineEntityFactory<void, string>(
      'role',
      ({ oneOf }) => oneOf([])
    );

    expect(() => buildRole(0, undefined)).toThrow(
      '[faker-genetics] oneOf requires at least one value for entity "role".'
    );
  });
});
