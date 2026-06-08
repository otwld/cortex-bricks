import {
  Faker,
  en,
  generateMersenne53Randomizer,
  type LocaleDefinition,
} from '@faker-js/faker';

export type FakerSeed = number | string;
export type FakerEntityKey = string | number;
type GeneticsComparable = string | number | boolean | Date | null | undefined;

/**
 * Faker Genetics Options definition used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
export interface FakerGeneticsOptions {
  seed: FakerSeed;
  refDate?: Date | string;
  locale?: LocaleDefinition | LocaleDefinition[];
}

/**
 * Faker Entity Context definition used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
export interface FakerEntityContext {
  faker: Faker;
  seed: number;
  entity: string;
  key: string;
  id: (namespace: string, key?: FakerEntityKey) => string;
  maybe: (probability?: number) => boolean;
  oneOf: <TValue>(values: readonly TValue[]) => TValue;
}

export type FakerEntityBuilder<TInput, TEntity> = (
  context: FakerEntityContext,
  input: TInput
) => TEntity;

export type FakerEntityFactory<TInput, TEntity> = (
  key: FakerEntityKey,
  input: TInput
) => TEntity;

/**
 * Genetics Search Request definition used across Cortex libraries.
 * For example, search candidates by skill and paginate results for recruiter dashboards.
 */
export interface GeneticsSearchRequest {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Genetics Search Result definition used across Cortex libraries.
 * For example, search candidates by skill and paginate results for recruiter dashboards.
 */
export interface GeneticsSearchResult<TEntity> {
  items: TEntity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

/**
 * Genetics Search Options definition used across Cortex libraries.
 * For example, search candidates by skill and paginate results for recruiter dashboards.
 */
export interface GeneticsSearchOptions<TEntity> {
  searchBy?: Array<keyof TEntity | ((item: TEntity) => GeneticsComparable)>;
  sorters?: Record<string, (item: TEntity) => GeneticsComparable>;
  filters?: Array<(item: TEntity) => boolean>;
  defaultSort?: (a: TEntity, b: TEntity) => number;
}

/**
 * Faker Genetics Runtime definition used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
export interface FakerGeneticsRuntime {
  seed: number;
  defineEntityFactory: <TInput, TEntity>(
    entityName: string,
    builder: FakerEntityBuilder<TInput, TEntity>
  ) => FakerEntityFactory<TInput, TEntity>;
  many: <TEntity>(
    count: number,
    factory: (index: number) => TEntity
  ) => TEntity[];
  createId: (namespace: string, key?: FakerEntityKey) => string;
  search: <TEntity>(
    items: readonly TEntity[],
    request?: GeneticsSearchRequest,
    options?: GeneticsSearchOptions<TEntity>
  ) => GeneticsSearchResult<TEntity>;
}

/**
 * DEFAULT PAGE definition used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
const DEFAULT_PAGE = 1;
/**
 * DEFAULT PAGE SIZE definition used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
const DEFAULT_PAGE_SIZE = 25;
/**
 * DEFAULT PROBABILITY definition used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
const DEFAULT_PROBABILITY = 0.5;
/**
 * MAX PAGE SIZE definition used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
const MAX_PAGE_SIZE = 500;

/**
 * normalize Seed operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
function normalizeSeed(seed: FakerSeed): number {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return Math.abs(Math.trunc(seed)) || 1;
  }

  const value = String(seed).trim();
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash) || 1;
}

/**
 * normalize Key operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
function normalizeKey(key: FakerEntityKey | undefined): string {
  if (key === undefined) {
    return 'default';
  }

  return String(key);
}

/**
 * create Scoped Seed operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
function createScopedSeed(baseSeed: number, scope: string): number {
  return normalizeSeed(`${baseSeed}:${scope}`);
}

/**
 * create Faker operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
function createFaker(seed: number, locale?: LocaleDefinition | LocaleDefinition[]): Faker {
  const randomizer = generateMersenne53Randomizer(seed);

  return new Faker({
    locale: locale ?? en,
    randomizer,
  });
}

/**
 * compare Json Values operation used across Cortex libraries.
 * For example, support recruiter and candidate workflows in the job-board universe.
 */
function compareJsonValues(a: GeneticsComparable, b: GeneticsComparable): number {
  if (a === b) {
    return 0;
  }

  const left = a ?? '';
  const right = b ?? '';

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

/**
 * value As Searchable Text operation used across Cortex libraries.
 * For example, search candidates by skill and paginate results for recruiter dashboards.
 */
function valueAsSearchableText(value: GeneticsComparable): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().toLowerCase();
  }

  return String(value).toLowerCase();
}

/**
 * apply Search operation used across Cortex libraries.
 * For example, search candidates by skill and paginate results for recruiter dashboards.
 */
function applySearch<TEntity>(
  items: readonly TEntity[],
  request: GeneticsSearchRequest = {},
  options: GeneticsSearchOptions<TEntity> = {}
): GeneticsSearchResult<TEntity> {
  const page = Math.max(DEFAULT_PAGE, request.page ?? DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, request.pageSize ?? DEFAULT_PAGE_SIZE)
  );
  const query = request.query?.trim().toLowerCase() ?? '';

  const filteredByPredicate = options.filters?.length
    ? items.filter((item) => options.filters?.every((filter) => filter(item)))
    : [...items];

  const filteredByQuery =
    query.length === 0 || !options.searchBy?.length
      ? filteredByPredicate
      : filteredByPredicate.filter((item) =>
          options.searchBy?.some((selector) => {
            const value =
              typeof selector === 'function'
                ? selector(item)
                : (item[selector] as GeneticsComparable);

            return valueAsSearchableText(value).includes(query);
          })
        );

  const sorted = [...filteredByQuery];
  const direction = request.sortDirection === 'desc' ? -1 : 1;

  if (request.sortBy && options.sorters?.[request.sortBy]) {
    const sorter = options.sorters[request.sortBy];
    sorted.sort((a, b) => direction * compareJsonValues(sorter(a), sorter(b)));
  } else if (options.defaultSort) {
    sorted.sort(options.defaultSort);
  }

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const boundedPage = Math.min(page, totalPages);
  const start = (boundedPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: sorted.slice(start, end),
    total,
    page: boundedPage,
    pageSize,
    totalPages,
    hasNextPage: boundedPage < totalPages,
  };
}

/**
 * Creates a deterministic faker runtime for Storybook/MSW mocks.
 * Use a fixed seed to keep generated snapshots stable (e.g., Chromatic).
 */
export function createFakerGenetics(
  options: FakerGeneticsOptions
): FakerGeneticsRuntime {
  const seed = normalizeSeed(options.seed);
  const entityCache = new Map<string, unknown>();

  const createId = (namespace: string, key?: FakerEntityKey): string => {
    const normalized = normalizeKey(key);
    const hashed = createScopedSeed(seed, `${namespace}:${normalized}`)
      .toString(36)
      .slice(0, 8);

    return `${namespace}_${normalized}_${hashed}`;
  };

  const defineEntityFactory = <TInput, TEntity>(
    entityName: string,
    builder: FakerEntityBuilder<TInput, TEntity>
  ): FakerEntityFactory<TInput, TEntity> => {
    return (key: FakerEntityKey, input: TInput): TEntity => {
      const normalizedKey = normalizeKey(key);
      const cacheKey = `${entityName}:${normalizedKey}`;

      if (entityCache.has(cacheKey)) {
        return entityCache.get(cacheKey) as TEntity;
      }

      const fakerSeed = createScopedSeed(seed, cacheKey);
      const faker = createFaker(fakerSeed, options.locale);
      const maybeSetDefaultRefDate = (
        fakerInstance: Faker,
        refDate: Date | string
      ): void => {
        const candidate = fakerInstance as Faker & {
          setDefaultRefDate?: (value: Date | string) => void;
        };

        candidate.setDefaultRefDate?.(refDate);
      };

      if (options.refDate) {
        maybeSetDefaultRefDate(faker, options.refDate);
      }

      const context: FakerEntityContext = {
        faker,
        seed: fakerSeed,
        entity: entityName,
        key: normalizedKey,
        id: createId,
        maybe: (probability = DEFAULT_PROBABILITY) =>
          faker.number.float({ min: 0, max: 1 }) <= probability,
        oneOf: <TValue>(values: readonly TValue[]) => {
          if (values.length === 0) {
            throw new Error(
              `[faker-genetics] oneOf requires at least one value for entity "${entityName}".`
            );
          }

          return values[faker.number.int({ min: 0, max: values.length - 1 })];
        },
      };

      const entity = builder(context, input);
      entityCache.set(cacheKey, entity);

      return entity;
    };
  };

  return {
    seed,
    defineEntityFactory,
    many: <TEntity>(count: number, factory: (index: number) => TEntity): TEntity[] => {
      const size = Math.max(0, Math.trunc(count));
      const values: TEntity[] = [];

      for (let index = 0; index < size; index += 1) {
        values.push(factory(index));
      }

      return values;
    },
    createId,
    search: <TEntity>(
      items: readonly TEntity[],
      request?: GeneticsSearchRequest,
      searchOptions?: GeneticsSearchOptions<TEntity>
    ): GeneticsSearchResult<TEntity> =>
      applySearch(items, request, searchOptions),
  };
}
