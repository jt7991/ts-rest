import {
  QueryFunctionContext,
  QueryKey,
  useInfiniteQuery,
  useQueries,
  useQuery,
  QueryClient,
  useSuspenseQuery,
  useSuspenseQueries,
  useSuspenseInfiniteQuery,
  useMutation,
  usePrefetchQuery,
  usePrefetchInfiniteQuery,
  QueryOptions,
  skipToken,
} from '@tanstack/react-query';
import {
  AppRoute,
  AppRouter,
  ClientArgs,
  evaluateFetchApiArgs,
  fetchApi,
  getRouteQuery,
  isAppRoute,
  isAppRouteQuery,
  isErrorResponse,
} from '@ts-rest/core';
import {
  MutationHooks,
  QueryHooks,
  TsRestReactQueryHooksContainer,
  TsRestInfiniteQueryOptions,
  TsRestQueryClientFunctions,
  TsRestReactQueryClientFunctionsContainer,
  TsRestReactQueryClient,
  RequestData,
  DataResponse,
} from '../types';

const apiFetcher = <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
  route: TAppRoute,
  clientArgs: TClientArgs,
  abortSignal?: AbortSignal,
) => {
  return async (requestData?: RequestData<TAppRoute, TClientArgs>) => {
    const fetchApiArgs = evaluateFetchApiArgs(
      route,
      clientArgs,
      requestData as any,
    );
    const result = await fetchApi({
      ...fetchApiArgs,
      fetchOptions: {
        ...(abortSignal && { signal: abortSignal }),
        ...fetchApiArgs.fetchOptions,
      },
    });

    // If the response is not a 2XX, throw an error to be handled by react-query
    if (isErrorResponse(result)) {
      throw result;
    }

    return result as DataResponse<TAppRoute>;
  };
};

const createQueryKey = (
  routePath: string,
  queryData: unknown,
  type?: 'infinite',
): QueryKey => {
  // A skipped query must not observe the cache entry for a request without data.
  const key = [routePath, queryData === skipToken ? 'skipToken' : queryData];
  return type === 'infinite' ? [...key, type] : key;
};

const createRouteFilterKey = (
  routePath: string,
  queryData?: unknown,
): QueryKey => (queryData === undefined ? [routePath] : [routePath, queryData]);

function createBaseQueryOptions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TOptions extends QueryOptions<any, any>,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
  routePath: string,
  options: TOptions,
  type?: 'infinite',
): TOptions & { queryKey: QueryKey } {
  const { queryData, getPageQueryData, ...rqOptions } =
    options as unknown as TOptions &
      TsRestInfiniteQueryOptions<TAppRoute, TClientArgs> & {
        initialPageParam?: unknown;
      };
  const initialQueryData =
    typeof queryData === 'function'
      ? queryData({ pageParam: rqOptions.initialPageParam })
      : queryData;
  return {
    ...rqOptions,
    queryKey: createQueryKey(routePath, initialQueryData, type),
    queryFn:
      queryData === skipToken
        ? skipToken
        : (context: QueryFunctionContext<QueryKey, unknown>) => {
            const requestData =
              typeof queryData === 'function'
                ? queryData({ pageParam: context.pageParam })
                : getPageQueryData
                ? getPageQueryData(context)
                : queryData;

            return apiFetcher(route, clientArgs, context.signal)(requestData);
          },
  } as unknown as TOptions & { queryKey: QueryKey };
}

const appendTsRestResult = <T, TAppRoute extends AppRoute>(
  result: T,
  tsResult: {
    contractEndpoint: TAppRoute;
  },
) => ({
  ...result,
  ...tsResult,
});

const tanstackQueryHooks = {
  query: {
    useQuery,
    useSuspenseQuery,
    useInfiniteQuery,
    useSuspenseInfiniteQuery,
  },
  queries: {
    useQueries,
    useSuspenseQueries,
  },
  prefetch: {
    usePrefetchQuery,
    usePrefetchInfiniteQuery,
  },
};

const wrapHooks = <
  T extends
    | typeof tanstackQueryHooks.query
    | typeof tanstackQueryHooks.queries
    | typeof tanstackQueryHooks.prefetch,
  H extends T extends
    | typeof tanstackQueryHooks.query
    | typeof tanstackQueryHooks.prefetch
    ? (options: QueryOptions<any, any>, queryClient?: QueryClient) => any
    : (
        options: { queries: QueryOptions<any, any>[] },
        queryClient?: QueryClient,
      ) => any,
>(
  hooks: T,
  getWrapper: (hook: H, hookName: string) => H,
) => {
  return Object.fromEntries(
    Object.entries(hooks).map(([hookName, hook]) => [
      hookName,
      getWrapper(hook, hookName),
    ]),
  ) as any;
};

const wrapAllHooks = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
>(
  appRoute: TAppRoute,
  clientOptions: TClientArgs,
  routePath: string,
) => {
  return {
    ...wrapHooks(
      tanstackQueryHooks.query,
      (hook, hookName) =>
        (options = {}, queryClient) => {
          return appendTsRestResult(
            hook(
              createBaseQueryOptions(
                appRoute,
                clientOptions,
                routePath,
                options,
                hookName === 'useInfiniteQuery' ||
                  hookName === 'useSuspenseInfiniteQuery'
                  ? 'infinite'
                  : undefined,
              ),
              queryClient,
            ),
            {
              contractEndpoint: appRoute,
            },
          );
        },
    ),
    ...wrapHooks(
      tanstackQueryHooks.queries,
      (hook) => (options, queryClient) => {
        return hook(
          {
            ...options,
            queries: options.queries.map((queryOptions) =>
              createBaseQueryOptions(
                appRoute,
                clientOptions,
                routePath,
                queryOptions as any,
              ),
            ),
          } as any,
          queryClient,
        );
      },
    ),
    ...wrapHooks(tanstackQueryHooks.prefetch, (hook, hookName) => (options) => {
      return hook(
        createBaseQueryOptions(
          appRoute,
          clientOptions,
          routePath,
          options,
          hookName === 'usePrefetchInfiniteQuery' ? 'infinite' : undefined,
        ),
      );
    }),
  };
};

export const initHooksContainer = <
  TContract extends AppRouter,
  TClientArgs extends ClientArgs,
>(
  contract: TContract,
  clientOptions: TClientArgs,
): TsRestReactQueryHooksContainer<TContract, TClientArgs> => {
  const recursiveInit = <TInner extends AppRouter>(
    innerRouter: TInner,
    parentPath = '',
  ): TsRestReactQueryHooksContainer<TInner, TClientArgs> => {
    return Object.fromEntries(
      Object.entries(innerRouter).map(([key, subRouter]) => {
        const routePath = parentPath ? `${parentPath}.${key}` : key;
        if (isAppRoute(subRouter)) {
          if (isAppRouteQuery(subRouter)) {
            return [
              key,
              {
                query: getRouteQuery(subRouter, clientOptions) as any,
                queryOptions: (options) =>
                  createBaseQueryOptions(
                    subRouter,
                    clientOptions,
                    routePath,
                    options,
                  ),
                getQueryKey: (queryData, type) =>
                  createQueryKey(routePath, queryData, type),
                ...wrapAllHooks(subRouter, clientOptions, routePath),
              } as QueryHooks<typeof subRouter, TClientArgs>,
            ];
          } else {
            return [
              key,
              {
                mutate: getRouteQuery(subRouter, clientOptions) as any,
                useMutation: (options) => {
                  return appendTsRestResult(
                    useMutation({
                      ...options,
                      mutationFn: apiFetcher(subRouter, clientOptions) as any,
                    }),
                    {
                      contractEndpoint: subRouter,
                    },
                  );
                },
              } as MutationHooks<typeof subRouter, TClientArgs>,
            ];
          }
        } else {
          return [key, recursiveInit(subRouter, routePath)];
        }
      }),
    );
  };

  return recursiveInit(contract);
};

export const initQueryClient = <
  TContract extends AppRouter,
  TClientArgs extends ClientArgs,
>(
  contract: TContract,
  clientOptions: TClientArgs,
  queryClient: QueryClient,
): TsRestReactQueryClient<TContract, TClientArgs> => {
  const recursiveInit = <TInner extends AppRouter>(
    innerRouter: TInner,
    parentPath = '',
  ): TsRestReactQueryClientFunctionsContainer<TInner, TClientArgs> => {
    return Object.fromEntries(
      Object.entries(innerRouter).map(([key, subRouter]) => {
        const routePath = parentPath ? `${parentPath}.${key}` : key;
        if (isAppRoute(subRouter)) {
          if (isAppRouteQuery(subRouter)) {
            return [
              key,
              {
                getQueryData: (queryData) => {
                  return queryClient.getQueryData(
                    createQueryKey(routePath, queryData),
                  );
                },
                invalidateQueries: (queryData, filters, options) => {
                  return queryClient.invalidateQueries(
                    {
                      ...filters,
                      queryKey: createRouteFilterKey(routePath, queryData),
                    },
                    options,
                  );
                },
                ensureQueryData: (options) => {
                  return queryClient.ensureQueryData(
                    createBaseQueryOptions(
                      subRouter,
                      clientOptions,
                      routePath,
                      options,
                    ),
                  );
                },
                getQueriesData: (filters) => {
                  return queryClient.getQueriesData(filters);
                },
                setQueryData: (queryData, updater, options) => {
                  return queryClient.setQueryData(
                    createQueryKey(routePath, queryData),
                    updater,
                    options,
                  );
                },
                setQueriesData: (filters, updater, options) => {
                  return queryClient.setQueriesData(filters, updater, options);
                },
                getQueryState: (queryData) => {
                  return queryClient.getQueryState(
                    createQueryKey(routePath, queryData),
                  );
                },
                fetchQuery: (options) => {
                  return queryClient.fetchQuery(
                    createBaseQueryOptions(
                      subRouter,
                      clientOptions,
                      routePath,
                      options,
                    ),
                  );
                },
                prefetchQuery: (options) => {
                  return queryClient.prefetchQuery(
                    createBaseQueryOptions(
                      subRouter,
                      clientOptions,
                      routePath,
                      options,
                    ),
                  );
                },
                fetchInfiniteQuery: (options) => {
                  return queryClient.fetchInfiniteQuery(
                    createBaseQueryOptions(
                      subRouter,
                      clientOptions,
                      routePath,
                      options,
                      'infinite',
                    ),
                  );
                },
                prefetchInfiniteQuery: (options) => {
                  return queryClient.prefetchInfiniteQuery(
                    createBaseQueryOptions(
                      subRouter,
                      clientOptions,
                      routePath,
                      options,
                      'infinite',
                    ),
                  );
                },
              } as TsRestQueryClientFunctions<typeof subRouter, TClientArgs>,
            ];
          } else {
            return [key, undefined];
          }
        } else {
          return [key, recursiveInit(subRouter, routePath)];
        }
      }),
    );
  };

  return Object.assign(queryClient, recursiveInit(contract));
};
