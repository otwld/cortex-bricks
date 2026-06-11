import { type JsonBodyType, HttpResponse, http, type RequestHandler } from 'msw';

import {
  type FakerGeneticsRuntime,
  type GeneticsSearchOptions,
  type GeneticsSearchRequest,
  type GeneticsSearchResult,
} from './faker-genetics';

type HttpResponseInit = Parameters<typeof HttpResponse.json>[1];

/**
 * Options for a reusable MSW GET handler backed by faker-genetics search.
 */
export interface MswSearchGetHandlerOptions<TEntity> {
  /** Search, filter, and sorting rules passed to the genetics runtime. */
  search?: GeneticsSearchOptions<TEntity>;
  /** Custom parser for APIs whose query parameter names differ from the default contract. */
  parseRequest?: (url: URL) => GeneticsSearchRequest;
  /** Response options passed to `HttpResponse.json`. */
  responseInit?: HttpResponseInit;
}

/** Options for MSW search handlers that transform the default search result body. */
export interface MswMappedSearchGetHandlerOptions<TEntity, TResponse extends JsonBodyType>
  extends MswSearchGetHandlerOptions<TEntity> {
  /** Convert the default genetics search result into the HTTP response body. */
  mapResponse: (
    result: GeneticsSearchResult<TEntity>,
    request: GeneticsSearchRequest,
    url: URL
  ) => TResponse;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const numeric = Number.parseInt(value, 10);

  if (Number.isNaN(numeric) || numeric < 1) {
    return fallback;
  }

  return numeric;
}

function defaultParseSearchRequest(url: URL): GeneticsSearchRequest {
  const queryParam = url.searchParams.get('query') ?? url.searchParams.get('q') ?? undefined;
  const sortDirectionRaw = url.searchParams.get('sortDirection');
  const sortDirection =
    sortDirectionRaw === 'asc' || sortDirectionRaw === 'desc'
      ? sortDirectionRaw
      : undefined;

  return {
    query: queryParam ?? undefined,
    page: parsePositiveInt(url.searchParams.get('page'), 1),
    pageSize: parsePositiveInt(url.searchParams.get('pageSize'), 25),
    sortBy: url.searchParams.get('sortBy') ?? undefined,
    sortDirection,
  };
}

/**
 * Creates a reusable MSW GET search handler backed by faker-genetics search logic.
 * Suitable for list/search endpoints consumed by HttpClient in stories.
 */
export function createMswSearchGetHandler<
  TEntity
>(
  genetics: Pick<FakerGeneticsRuntime, 'search'>,
  path: Parameters<typeof http.get>[0],
  items: readonly TEntity[],
  options?: MswSearchGetHandlerOptions<TEntity>
): RequestHandler;
export function createMswSearchGetHandler<
  TEntity,
  TResponse extends JsonBodyType
>(
  genetics: Pick<FakerGeneticsRuntime, 'search'>,
  path: Parameters<typeof http.get>[0],
  items: readonly TEntity[],
  options: MswMappedSearchGetHandlerOptions<TEntity, TResponse>
): RequestHandler;
export function createMswSearchGetHandler<TEntity, TResponse extends JsonBodyType>(
  genetics: Pick<FakerGeneticsRuntime, 'search'>,
  path: Parameters<typeof http.get>[0],
  items: readonly TEntity[],
  options: MswSearchGetHandlerOptions<TEntity> | MswMappedSearchGetHandlerOptions<TEntity, TResponse> = {}
): RequestHandler {
  return http.get(path, ({ request }) => {
    const url = new URL(request.url);
    const parsedRequest = (options.parseRequest ?? defaultParseSearchRequest)(url);
    const result = genetics.search(items, parsedRequest, options.search);
    const responseBody = 'mapResponse' in options
      ? options.mapResponse(result, parsedRequest, url)
      : result;

    return HttpResponse.json(responseBody, options.responseInit);
  });
}
