import {
  Faker,
  en,
  generateMersenne53Randomizer,
  type LocaleDefinition,
} from '@faker-js/faker';

/**
 * Seed value used to make generated Storybook data deterministic.
 */
export type FakerSeed = number | string;

/**
 * Stable entity key used when deriving deterministic IDs and records.
 */
export type FakerEntityKey = string | number;
type GeneticsComparable = string | number | boolean | Date | null | undefined;

/**
 * Options for a deterministic faker runtime used by Storybook stories.
 */
export interface FakerGeneticsOptions {
  /** Seed used to make generated entities stable across Storybook builds. */
  seed: FakerSeed;
  /** Reference date passed to faker date helpers when supported by the faker version. */
  refDate?: Date | string;
  /** Faker locale or locale chain used while generating story data. */
  locale?: LocaleDefinition | LocaleDefinition[];
}

/**
 * Builder utilities passed to deterministic entity factories.
 */
export interface FakerEntityContext {
  /** Faker instance scoped to the current entity key. */
  faker: Faker;
  /** Numeric seed derived from the runtime seed and entity key. */
  seed: number;
  /** Entity namespace passed to `defineEntityFactory`. */
  entity: string;
  /** Normalized key for the current generated entity. */
  key: string;
  /** Creates stable IDs for related entities. */
  id: (namespace: string, key?: FakerEntityKey) => string;
  /** Returns true according to a deterministic probability check. */
  maybe: (probability?: number) => boolean;
  /** Picks one value from a non-empty array using the scoped faker seed. */
  oneOf: <TValue>(values: readonly TValue[]) => TValue;
}

/**
 * Builder callback used by a faker genetics entity factory.
 */
export type FakerEntityBuilder<TInput, TEntity> = (
  context: FakerEntityContext,
  input: TInput
) => TEntity;

/**
 * Deterministic factory for one Storybook data entity.
 */
export type FakerEntityFactory<TInput, TEntity> = (
  key: FakerEntityKey,
  input: TInput
) => TEntity;

/**
 * Query, sorting, and pagination parameters accepted by deterministic search helpers.
 */
export interface GeneticsSearchRequest {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Paginated result returned by deterministic Storybook search handlers.
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
 * Field selectors, filters, and sorters used by deterministic search helpers.
 */
export interface GeneticsSearchOptions<TEntity> {
  searchBy?: Array<keyof TEntity | ((item: TEntity) => GeneticsComparable)>;
  sorters?: Record<string, (item: TEntity) => GeneticsComparable>;
  filters?: Array<(item: TEntity) => boolean>;
  defaultSort?: (a: TEntity, b: TEntity) => number;
}

/**
 * Runtime API for deterministic entity generation and search in stories.
 */
export interface FakerGeneticsRuntime {
  /** Normalized numeric seed used by this runtime. */
  seed: number;
  /** Defines a cached factory for one generated entity namespace. */
  defineEntityFactory: <TInput, TEntity>(
    entityName: string,
    builder: FakerEntityBuilder<TInput, TEntity>
  ) => FakerEntityFactory<TInput, TEntity>;
  /** Creates a deterministic array by invoking a factory for each index. */
  many: <TEntity>(
    count: number,
    factory: (index: number) => TEntity
  ) => TEntity[];
  /** Creates a stable ID for an entity namespace and key. */
  createId: (namespace: string, key?: FakerEntityKey) => string;
  /** Filters, sorts, and paginates a deterministic in-memory collection. */
  search: <TEntity>(
    items: readonly TEntity[],
    request?: GeneticsSearchRequest,
    options?: GeneticsSearchOptions<TEntity>
  ) => GeneticsSearchResult<TEntity>;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PROBABILITY = 0.5;
const MAX_PAGE_SIZE = 500;

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

function normalizeKey(key: FakerEntityKey | undefined): string {
  if (key === undefined) {
    return 'default';
  }

  return String(key);
}

function createScopedSeed(baseSeed: number, scope: string): number {
  return normalizeSeed(`${baseSeed}:${scope}`);
}

function createFaker(seed: number, locale?: LocaleDefinition | LocaleDefinition[]): Faker {
  const randomizer = generateMersenne53Randomizer(seed);

  return new Faker({
    locale: locale ?? en,
    randomizer,
  });
}

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

function valueAsSearchableText(value: GeneticsComparable): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().toLowerCase();
  }

  return String(value).toLowerCase();
}

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
